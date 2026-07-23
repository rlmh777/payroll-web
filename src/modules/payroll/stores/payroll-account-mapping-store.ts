import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PayrollAccountMapping {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  account_id?: string | null;
  sort_order: number;
  is_active: boolean;
  account?: { id: string; name: string; code1?: string | null } | null;
}

export const usePayrollAccountMappingStore = defineStore('payrollAccountMapping', {
  state: () => ({
    mappings: [] as PayrollAccountMapping[],
    isLoading: false,
    error: null as string | null,
    mappingToEdit: null as PayrollAccountMapping | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchMappings() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/payroll-account-mappings`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load account mappings');
        this.mappings = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading account mappings';
      } finally {
        this.isLoading = false;
      }
    },

    async createMapping(payload: Partial<PayrollAccountMapping>) {
      const response = await fetch(`${API_URL}/payroll-account-mappings`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.errors?.code?.[0] || body.message || 'Create failed');
      }
      await this.fetchMappings();
    },

    async updateMapping(id: string, payload: Partial<PayrollAccountMapping>) {
      const response = await fetch(`${API_URL}/payroll-account-mappings/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.errors?.name?.[0] || body.message || 'Update failed');
      }
      await this.fetchMappings();
    },

    async deleteMapping(id: string) {
      const response = await fetch(`${API_URL}/payroll-account-mappings/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.mappings = this.mappings.filter((item) => item.id !== id);
    },

    setMappingToEdit(mapping: PayrollAccountMapping | null) {
      this.mappingToEdit = mapping ? { ...mapping } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(usePayrollAccountMappingStore, import.meta.hot));
}
