import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmploymentDetail {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  jobTitleId?: number | null;
  requiresClocking?: boolean;
  benefits?: string | null;
  accountId: string;
  contractTypeId: number;
  employmentPolicies?: string | null;
  contractAgreementPath?: string | null;
  departmentId: number;
  worksiteId: number;
  defaultPayPeriodGroupId?: string | null;
  department?: { id: number; name: string } | null;
  worksite?: { id: number; name: string } | null;
  contractType?: { id: number; name: string } | null;
  jobTitle?: { id: number; name: string; payScale?: string | null; jobDescriptionUrl?: string | null } | null;
  chartOfAccount?: { id: string; name: string } | null;
  defaultPayPeriodGroup?: { id: string; name: string } | null;
}

type EmploymentDetailApiRecord = EmploymentDetail & {
  contract_type?: EmploymentDetail['contractType'];
  job_title?: EmploymentDetail['jobTitle'];
  chart_of_account?: EmploymentDetail['chartOfAccount'];
  default_pay_period_group?: EmploymentDetail['defaultPayPeriodGroup'];
};

function normalizeEmploymentDetail(record: EmploymentDetailApiRecord): EmploymentDetail {
  return {
    ...record,
    contractType: record.contractType ?? record.contract_type ?? null,
    jobTitle: record.jobTitle ?? record.job_title ?? null,
    chartOfAccount: record.chartOfAccount ?? record.chart_of_account ?? null,
    defaultPayPeriodGroup: record.defaultPayPeriodGroup ?? record.default_pay_period_group ?? null,
  };
}

export interface EmploymentDetailPayload {
  employeeId: string;
  startDate: string;
  endDate: string | null;
  isActive?: boolean;
  jobTitleId?: number | null;
  requiresClocking?: boolean;
  benefits?: string | null;
  accountId: string;
  contractTypeId: number;
  employmentPolicies?: string | null;
  contractAgreementPath?: string | null;
  departmentId: number;
  worksiteId: number;
  defaultPayPeriodGroupId: string;
}

export const useEmploymentDetailStore = defineStore('employmentDetail', {
  state: () => ({
    records: [] as EmploymentDetail[],
    isLoading: false,
    recordToEdit: null as EmploymentDetail | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(includeJsonContentType = true) {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};
      if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
      }
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    buildRequestBody(
      payload: EmploymentDetailPayload | Partial<EmploymentDetailPayload>,
      contractAgreementFile?: File | null,
    ): { body: BodyInit; headers: HeadersInit } {
      if (!contractAgreementFile) {
        return {
          body: JSON.stringify(payload),
          headers: this.buildHeaders(true),
        };
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null) {
          formData.append(key, '');
          return;
        }
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
          return;
        }
        formData.append(key, String(value));
      });
      formData.append('contractAgreement', contractAgreementFile);

      return {
        body: formData,
        headers: this.buildHeaders(false),
      };
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          employeeId,
          per_page: '50',
          sortBy: 'startDate',
          sortDirection: 'desc',
        });
        const response = await fetch(`${API_URL}/employment-details?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to load employment details');

        const data = await response.json();
        const rows = Array.isArray(data.data) ? data.data as EmploymentDetailApiRecord[] : [];
        this.records = rows.map(normalizeEmploymentDetail);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading employment details';
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: EmploymentDetailPayload, contractAgreementFile?: File | null) {
      const { body, headers } = this.buildRequestBody(payload, contractAgreementFile);
      const response = await fetch(`${API_URL}/employment-details`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(body) || 'Create failed');
      }
    },

    async updateRecord(
      id: string,
      payload: Partial<EmploymentDetailPayload>,
      contractAgreementFile?: File | null,
    ): Promise<{ revised: boolean; data?: EmploymentDetail }> {
      const { body, headers } = this.buildRequestBody(payload, contractAgreementFile);

      if (contractAgreementFile && body instanceof FormData) {
        body.append('_method', 'PUT');
      }

      const response = await fetch(`${API_URL}/employment-details/${id}`, {
        method: contractAgreementFile ? 'POST' : 'PUT',
        headers,
        body,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(errorBody) || 'Update failed');
      }

      const result = await response.json();
      const data = result.data as EmploymentDetail | undefined;

      return data
        ? { revised: Boolean(result.revised), data }
        : { revised: Boolean(result.revised) };
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employment-details/${id}`, {
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

    setRecordToEdit(record: EmploymentDetail | null) {
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
  import.meta.hot.accept(acceptHMRUpdate(useEmploymentDetailStore, import.meta.hot));
}
