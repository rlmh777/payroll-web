import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type Mailer = 'smtp' | 'log';
export type MailEncryption = 'tls' | 'ssl' | 'none';

export interface MailSettings {
  enabled: boolean;
  mailer: Mailer;
  host: string | null;
  port: number;
  username: string | null;
  passwordSet: boolean;
  encryption: MailEncryption;
  fromAddress: string | null;
  fromName: string | null;
}

export interface MailSettingsPayload {
  enabled: boolean;
  mailer: Mailer;
  host?: string | null;
  port?: number | null;
  username?: string | null;
  password?: string | null;
  encryption?: MailEncryption | null;
  fromAddress?: string | null;
  fromName?: string | null;
}

export interface MailTestPayload extends MailSettingsPayload {
  to: string;
}

export interface MailTestResult {
  ok: boolean;
  message: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function normalizeSettings(data: Partial<MailSettings> | null | undefined): MailSettings {
  const mailer = String(data?.mailer ?? 'smtp').toLowerCase();
  const encryption = String(data?.encryption ?? 'none').toLowerCase();

  return {
    enabled: data?.enabled !== false,
    mailer: mailer === 'log' ? 'log' : 'smtp',
    host: data?.host ?? null,
    port: Number(data?.port) || 587,
    username: data?.username ?? null,
    passwordSet: Boolean(data?.passwordSet),
    encryption: encryption === 'tls' || encryption === 'ssl' ? encryption : 'none',
    fromAddress: data?.fromAddress ?? null,
    fromName: data?.fromName ?? null,
  };
}

export const useMailSettingsStore = defineStore('mailSettings', {
  state: () => ({
    settings: null as MailSettings | null,
    isLoading: false,
    isSaving: false,
    isTesting: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async parseError(response: Response, fallback: string): Promise<string> {
      const body = await response.json().catch(() => ({}));
      const firstError = body.errors ? Object.values(body.errors).flat()[0] : null;
      return (typeof firstError === 'string' ? firstError : null) || body.message || fallback;
    },

    async fetchSettings() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/mail-settings`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to load email settings'));
        }
        this.settings = normalizeSettings(await response.json());
        return this.settings;
      } catch (error) {
        this.settings = null;
        this.error = error instanceof Error ? error.message : 'Failed to load email settings';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(payload: MailSettingsPayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/mail-settings`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            (typeof Object.values(body.errors ?? {}).flat()[0] === 'string'
              ? (Object.values(body.errors).flat()[0] as string)
              : null) ||
              body.message ||
              'Failed to save email settings',
          );
        }
        this.settings = normalizeSettings(body.data ?? body);
        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save email settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async testConnection(payload: MailTestPayload): Promise<MailTestResult> {
      this.isTesting = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/mail-settings/test`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = (await response.json().catch(() => ({}))) as MailTestResult & { message?: string };
        const result: MailTestResult = {
          ok: Boolean(body.ok),
          message: body.message || (response.ok ? 'Test email sent.' : 'Failed to send test email.'),
        };
        if (!result.ok) {
          this.error = result.message;
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to send test email';
        this.error = message;
        return { ok: false, message };
      } finally {
        this.isTesting = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMailSettingsStore, import.meta.hot));
}
