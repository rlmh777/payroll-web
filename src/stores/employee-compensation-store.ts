import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { EmploymentDetail } from './employment-detail-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeCompensation {
  id: string;
  employeeId: string;
  employmentDetailId: string;
  effectiveDate: string;
  endDate: string | null;
  isActive: boolean;
  compensationMethod: string;
  requiresClocking: boolean;
  hourlyRate: string | number;
  yearlyRate: string | number;
  standardWeeklyHours?: string | number | null;
  payscale?: string | null;
  payscalePoint?: string | null;
  reasonType: string;
  reasonNote?: string | null;
  approvedById?: string | null;
  employmentDetail?: EmploymentDetail | null;
  approvedBy?: { id: string; firstName: string; lastName: string } | null;
}

export interface EmployeeCompensationPayload {
  employeeId: string;
  employmentDetailId: string;
  effectiveDate: string;
  endDate: string | null;
  isActive?: boolean;
  compensationMethod: string;
  requiresClocking: boolean;
  hourlyRate: number;
  yearlyRate: number;
  standardWeeklyHours?: number | null;
  payscale?: string | null;
  payscalePoint?: string | null;
  reasonType: string;
  reasonNote?: string | null;
}

type EmployeeCompensationApiRecord = EmployeeCompensation & {
  employment_detail?: EmploymentDetailApiRecord | null;
};

type EmploymentDetailApiRecord = EmploymentDetail & {
  contract_type?: EmploymentDetail['contractType'];
  chart_of_account?: EmploymentDetail['chartOfAccount'];
  default_pay_period_group?: EmploymentDetail['defaultPayPeriodGroup'];
};

function normalizeEmploymentDetail(record: EmploymentDetailApiRecord | null | undefined): EmploymentDetail | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    contractType: record.contractType ?? record.contract_type ?? null,
    chartOfAccount: record.chartOfAccount ?? record.chart_of_account ?? null,
    defaultPayPeriodGroup: record.defaultPayPeriodGroup ?? record.default_pay_period_group ?? null,
  };
}

function normalizeEmployeeCompensation(record: EmployeeCompensationApiRecord): EmployeeCompensation {
  const employmentDetail = normalizeEmploymentDetail(
    record.employmentDetail as EmploymentDetailApiRecord | null | undefined
      ?? record.employment_detail,
  );

  return {
    ...record,
    employmentDetail,
  };
}

export const useEmployeeCompensationStore = defineStore('employeeCompensation', {
  state: () => ({
    records: [] as EmployeeCompensation[],
    isLoading: false,
    recordToEdit: null as EmployeeCompensation | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          employeeId,
          per_page: '50',
          sortBy: 'effectiveDate',
          sortDirection: 'desc',
        });
        const response = await fetch(`${API_URL}/employee-compensations?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to load compensation records');

        const data = await response.json();
        const rows = Array.isArray(data.data) ? data.data as EmployeeCompensationApiRecord[] : [];
        this.records = rows.map(normalizeEmployeeCompensation);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading compensation records';
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: EmployeeCompensationPayload) {
      const response = await fetch(`${API_URL}/employee-compensations`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(body) || 'Create failed');
      }
    },

    async updateRecord(
      id: string,
      payload: Partial<EmployeeCompensationPayload>,
    ): Promise<{ revised: boolean }> {
      const response = await fetch(`${API_URL}/employee-compensations/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(errorBody) || 'Update failed');
      }

      const result = await response.json();

      return {
        revised: Boolean(result.revised),
      };
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-compensations/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(body) || 'Delete failed');
      }

      this.records = this.records.filter((r) => r.id !== id);
    },

    extractErrorMessage(body: Record<string, unknown>): string | null {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const firstField = Object.values(errors)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }

      return typeof body.message === 'string' ? body.message : null;
    },

    setRecordToEdit(record: EmployeeCompensation | null) {
      this.recordToEdit = record ? { ...record } : null;
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeCompensationStore, import.meta.hot));
}
