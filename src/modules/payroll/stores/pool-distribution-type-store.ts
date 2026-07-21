import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type PoolCalculationMode = 'weighted_points' | 'equal_share' | 'manual' | 'disabled';

export interface PoolDistributionType {
  id: number;
  code: string;
  name: string;
  calculation_mode: PoolCalculationMode;
  is_active: boolean;
  requires_hours_eligibility: boolean;
  payroll_earning_code_id?: number | null;
  allowance_id?: string | null;
  is_taxable: boolean;
  is_ss_subject: boolean;
  sort_order: number;
  notes?: string | null;
  payrollEarningCode?: { id: number; code: string; name: string } | null;
  allowance?: { id: string; name: string } | null;
}

export interface PoolDistributionTypePayload {
  code: string;
  name: string;
  calculation_mode: PoolCalculationMode;
  is_active?: boolean;
  requires_hours_eligibility?: boolean;
  payroll_earning_code_id?: number | null;
  allowance_id?: string | null;
  is_taxable?: boolean;
  is_ss_subject?: boolean;
  sort_order?: number;
  notes?: string | null;
}

export const POOL_CALCULATION_MODE_OPTIONS = [
  { value: 'weighted_points', label: 'Weighted points' },
  { value: 'equal_share', label: 'Equal share among eligible' },
  { value: 'manual', label: 'Manual (no auto distribution)' },
  { value: 'disabled', label: 'Disabled' },
] as const;

export const usePoolDistributionTypeStore = defineStore('pool-distribution-type', {
  state: () => ({
    types: [] as PoolDistributionType[],
    isLoading: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    typeToEdit: null as PoolDistributionType | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchTypes(page?: number, perPage?: number) {
      this.isLoading = true;
      this.error = null;
      try {
        const currentPage = page ?? this.currentPage;
        const query = new URLSearchParams({
          page: String(currentPage),
          per_page: String(perPage ?? 25),
        });
        if (this.search) query.append('search', this.search);

        const response = await fetch(`${API_URL}/pool-distribution-types?${query}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load pool distribution types.');

        const data = await response.json();
        this.types = data.data ?? [];
        this.currentPage = data.current_page ?? currentPage;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.types.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load pool types.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAllActive() {
      const response = await fetch(
        `${API_URL}/pool-distribution-types?all=1&is_active=1`,
        { headers: this.buildHeaders() },
      );
      if (!response.ok) throw new Error('Failed to load pool distribution types.');
      const data = await response.json();
      return (data.data ?? []) as PoolDistributionType[];
    },

    async createType(payload: PoolDistributionTypePayload) {
      const response = await fetch(`${API_URL}/pool-distribution-types`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to create pool distribution type.');
      }
      return response.json();
    },

    async updateType(id: number, payload: Partial<PoolDistributionTypePayload>) {
      const response = await fetch(`${API_URL}/pool-distribution-types/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to update pool distribution type.');
      }
      return response.json();
    },

    async deleteType(id: number) {
      const response = await fetch(`${API_URL}/pool-distribution-types/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete pool distribution type.');
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePoolDistributionTypeStore, import.meta.hot));
}
