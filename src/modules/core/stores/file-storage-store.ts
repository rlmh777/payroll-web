import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type StorageDriver = 'local' | 'azure' | 's3';

export interface FileStorageSettings {
  driver: StorageDriver;
  container: string;
  accountName: string | null;
  accountKeySet: boolean;
  endpoint: string | null;
  region: string | null;
  usePathStyleEndpoint: boolean;
  prefix: string | null;
}

export interface FileStoragePayload {
  driver: StorageDriver;
  container?: string | null;
  accountName?: string | null;
  accountKey?: string | null;
  endpoint?: string | null;
  region?: string | null;
  usePathStyleEndpoint?: boolean;
  prefix?: string | null;
}

export interface FileStorageTestResult {
  ok: boolean;
  message: string;
  driver: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function normalizeSettings(data: Partial<FileStorageSettings> | null | undefined): FileStorageSettings {
  const driver = String(data?.driver ?? 'local').toLowerCase();

  return {
    driver: driver === 'azure' || driver === 's3' ? driver : 'local',
    container: data?.container || 'uploads',
    accountName: data?.accountName ?? null,
    accountKeySet: Boolean(data?.accountKeySet),
    endpoint: data?.endpoint ?? null,
    region: data?.region ?? null,
    usePathStyleEndpoint: Boolean(data?.usePathStyleEndpoint),
    prefix: data?.prefix ?? null,
  };
}

export const useFileStorageStore = defineStore('fileStorage', {
  state: () => ({
    settings: null as FileStorageSettings | null,
    isLoading: false,
    isSaving: false,
    isTesting: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchSettings() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/storage-settings`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load file storage settings');
        }
        this.settings = normalizeSettings(await response.json());
        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load file storage settings';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(payload: FileStoragePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/storage-settings`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const firstError = body.errors ? Object.values(body.errors).flat()[0] : null;
          throw new Error(
            (typeof firstError === 'string' ? firstError : null) ||
              body.message ||
              'Failed to save file storage settings',
          );
        }
        this.settings = normalizeSettings(body.data ?? body);
        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save file storage settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async testConnection(payload: FileStoragePayload): Promise<FileStorageTestResult> {
      this.isTesting = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/storage-settings/test`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = (await response.json().catch(() => ({}))) as FileStorageTestResult & {
          message?: string;
        };
        const result: FileStorageTestResult = {
          ok: Boolean(body.ok),
          message: body.message || (response.ok ? 'Connection succeeded.' : 'Connection failed.'),
          driver: body.driver || payload.driver,
        };
        if (!result.ok) {
          this.error = result.message;
        }
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to test storage connection';
        this.error = message;
        return { ok: false, message, driver: payload.driver };
      } finally {
        this.isTesting = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFileStorageStore, import.meta.hot));
}
