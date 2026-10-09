import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type BirthdayVisibility = 'none' | 'department' | 'company';
export type ReminderUnit = 'days' | 'weeks' | 'months';

export interface ContractExpiryOffset {
  value: number;
  unit: ReminderUnit;
}

export interface HrSettings {
  birthdayVisibility: BirthdayVisibility;
  contractExpiryEnabled: boolean;
  contractExpiryOffsets: ContractExpiryOffset[];
}

const DEFAULT_OFFSETS: ContractExpiryOffset[] = [
  { value: 3, unit: 'months' },
  { value: 1, unit: 'months' },
  { value: 1, unit: 'weeks' },
  { value: 1, unit: 'days' },
];

function normalizeOffset(item: Partial<ContractExpiryOffset> | null | undefined): ContractExpiryOffset | null {
  const value = Number(item?.value);
  const unit = String(item?.unit ?? '');
  if (!Number.isInteger(value) || value < 1) {
    return null;
  }
  if (unit !== 'days' && unit !== 'weeks' && unit !== 'months') {
    return null;
  }
  return { value, unit };
}

function normalizeSettings(data: Partial<HrSettings> | Record<string, unknown> | null | undefined): HrSettings {
  const offsets = Array.isArray(data?.contractExpiryOffsets)
    ? (data.contractExpiryOffsets as Partial<ContractExpiryOffset>[])
        .map(normalizeOffset)
        .filter((item): item is ContractExpiryOffset => item !== null)
    : [];

  return {
    birthdayVisibility: (data?.birthdayVisibility as BirthdayVisibility) || 'company',
    contractExpiryEnabled: data?.contractExpiryEnabled !== false,
    contractExpiryOffsets: offsets.length > 0 ? offsets : DEFAULT_OFFSETS.map((item) => ({ ...item })),
  };
}

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export const useHrSettingStore = defineStore('hrSetting', {
  state: () => ({
    settings: null as HrSettings | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchSettings() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/hr-settings`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load HR settings');
        }
        this.settings = normalizeSettings(body.data ?? body);
      } catch (error) {
        this.settings = null;
        this.error = error instanceof Error ? error.message : 'Failed to load HR settings';
      } finally {
        this.isLoading = false;
      }
    },

    async saveSettings(payload: Partial<HrSettings>) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/hr-settings`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save HR settings');
        }
        this.settings = normalizeSettings({
          ...this.settings,
          ...payload,
          ...(body.data ?? body),
        });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save HR settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHrSettingStore, import.meta.hot));
}
