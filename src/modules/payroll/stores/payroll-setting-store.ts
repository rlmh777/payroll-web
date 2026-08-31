import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export interface PendingTimesheetLock {
  payrollRunId: string;
  payrollNumber: string;
  periodStart: string | null;
  periodEnd: string | null;
  payDate: string | null;
  lockDueAt: string;
  proposedLockBeforeDate: string;
  isOverdue: boolean;
}

export interface PayrollSettings {
  incomeTaxRate: number;
  incomeTaxRatePercent: number;
  secondReliefAmount: number;
  timesheetLockBeforeDate: string | null;
  timesheetAutoLockEnabled: boolean;
  timesheetAutoLockTime: string;
  timesheetAutoLockDaysAfterPayDate: number;
  timesheetUnlockStartDate: string | null;
  timesheetUnlockEndDate: string | null;
  timesheetUnlockActive: boolean;
  pendingTimesheetLocks: PendingTimesheetLock[];
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function normalizePendingLock(row: Partial<PendingTimesheetLock>): PendingTimesheetLock {
  return {
    payrollRunId: String(row.payrollRunId ?? ''),
    payrollNumber: String(row.payrollNumber ?? ''),
    periodStart: row.periodStart ?? null,
    periodEnd: row.periodEnd ?? null,
    payDate: row.payDate ?? null,
    lockDueAt: String(row.lockDueAt ?? ''),
    proposedLockBeforeDate: String(row.proposedLockBeforeDate ?? ''),
    isOverdue: Boolean(row.isOverdue),
  };
}

function normalizeSettings(data: Partial<PayrollSettings> | null | undefined): PayrollSettings {
  const rate = Number(data?.incomeTaxRate ?? 0.25);

  return {
    incomeTaxRate: rate,
    incomeTaxRatePercent: Number(data?.incomeTaxRatePercent ?? rate * 100),
    secondReliefAmount: Number(data?.secondReliefAmount ?? 100),
    timesheetLockBeforeDate: data?.timesheetLockBeforeDate
      ? String(data.timesheetLockBeforeDate)
      : null,
    timesheetAutoLockEnabled: data?.timesheetAutoLockEnabled !== false,
    timesheetAutoLockTime: String(data?.timesheetAutoLockTime ?? '17:00'),
    timesheetAutoLockDaysAfterPayDate: Number(data?.timesheetAutoLockDaysAfterPayDate ?? 1),
    timesheetUnlockStartDate: data?.timesheetUnlockStartDate
      ? String(data.timesheetUnlockStartDate)
      : null,
    timesheetUnlockEndDate: data?.timesheetUnlockEndDate
      ? String(data.timesheetUnlockEndDate)
      : null,
    timesheetUnlockActive: Boolean(data?.timesheetUnlockActive),
    pendingTimesheetLocks: Array.isArray(data?.pendingTimesheetLocks)
      ? data.pendingTimesheetLocks.map((row) => normalizePendingLock(row))
      : [],
  };
}

export type PayrollSettingsUpdatePayload = {
  incomeTaxRate?: number;
  secondReliefAmount?: number;
  timesheetLockBeforeDate?: string | null;
  timesheetAutoLockEnabled?: boolean;
  timesheetAutoLockTime?: string;
  timesheetAutoLockDaysAfterPayDate?: number;
  timesheetUnlockStartDate?: string | null;
  timesheetUnlockEndDate?: string | null;
};

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

    async updateSettings(payload: PayrollSettingsUpdatePayload) {
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
