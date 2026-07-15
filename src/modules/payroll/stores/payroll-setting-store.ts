import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export interface PayrollSettings {
  incomeTaxRate: number;
  incomeTaxRatePercent: number;
  secondReliefAmount: number;
  timesheetLockBeforeDate: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function normalizeSettings(data: Partial<PayrollSettings> | null | undefined): PayrollSettings {
  const rate = Number(data?.incomeTaxRate ?? 0.25);

  return {
    incomeTaxRate: rate,
    incomeTaxRatePercent: Number(data?.incomeTaxRatePercent ?? rate * 100),
    secondReliefAmount: Number(data?.secondReliefAmount ?? 100),
    timesheetLockBeforeDate: data?.timesheetLockBeforeDate
      ? String(data.timesheetLockBeforeDate)
      : null,
  };
}

export const usePayrollSettingStore = defineStore('payrollSetting', {
  state: () => ({
    settings: null as PayrollSettings | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    async fetchSettings() {
      if (this.isLoading) {
        return this.settings;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/payroll-settings`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to load payroll settings (${response.status})`,
          );
        }

        const data = await response.json();
        this.settings = normalizeSettings(data);

        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load payroll settings';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(payload: {
      incomeTaxRate?: number;
      secondReliefAmount?: number;
      timesheetLockBeforeDate?: string | null;
    }) {
      this.isSaving = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/payroll-settings`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const validationMessage = errorBody.errors
            ? Object.values(errorBody.errors as Record<string, string[]>).flat().join(' ')
            : null;
          throw new Error(
            validationMessage || errorBody.message || `Failed to save payroll settings (${response.status})`,
          );
        }

        const data = await response.json();
        this.settings = normalizeSettings(data.data ?? { ...this.settings, ...payload });

        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save payroll settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePayrollSettingStore, import.meta.hot));
}
