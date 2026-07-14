import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeSsBenefitStatus {
  id: string;
  employeeId: string;
  is_receiving_benefit: boolean;
  ss_benefit_type_id?: number | null;
  benefit_type?: { id: number; name: string } | null;
  effective_from: string;
  effective_to?: string | null;
  verified_at?: string | null;
  notes?: string | null;
}

export interface SsContributionPreview {
  employee_amount: number;
  employer_amount: number;
  applied_rule_id: string | null;
  applied_tier_id: string | null;
  detail: Record<string, unknown>;
}

export const useEmployeeSsBenefitStore = defineStore('employeeSsBenefit', {
  state: () => ({
    records: [] as EmployeeSsBenefitStatus[],
    preview: null as SsContributionPreview | null,
    isLoading: false,
    recordToEdit: null as EmployeeSsBenefitStatus | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      try {
        const params = new URLSearchParams({ employeeId, per_page: '50' });
        const response = await fetch(`${API_URL}/employee-ss-benefit-status?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load SS benefit status');
        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading records';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPreview(employeeId: string, asOf?: string, weeklyInsurableEarnings = 520) {
      const params = new URLSearchParams({ weekly_insurable_earnings: String(weeklyInsurableEarnings) });
      if (asOf) params.append('as_of', asOf);
      const response = await fetch(`${API_URL}/employees/${employeeId}/ss-contribution-preview?${params}`, {
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to preview SS contribution');
      this.preview = await response.json();
      return this.preview;
    },

    async createRecord(payload: Partial<EmployeeSsBenefitStatus>) {
      const response = await fetch(`${API_URL}/employee-ss-benefit-status`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Create failed');
      }
    },

    async updateRecord(id: string, payload: Partial<EmployeeSsBenefitStatus>) {
      const response = await fetch(`${API_URL}/employee-ss-benefit-status/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Update failed');
      }
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-ss-benefit-status/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.records = this.records.filter((r) => r.id !== id);
    },

    setRecordToEdit(record: EmployeeSsBenefitStatus | null) {
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
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeSsBenefitStore, import.meta.hot));
}
