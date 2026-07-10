import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PayrollEarningCode {
  id: number;
  code: string;
  name: string;
  account_id?: string | null;
  is_taxable: boolean;
  is_ss_subject: boolean;
  is_active: boolean;
  sort_order: number;
  account?: { id: string; name: string; code1: string } | null;
}

export const usePayrollEarningCodeStore = defineStore('payrollEarningCode', {
  state: () => ({
    earningCodes: [] as PayrollEarningCode[],
    isLoading: false,
    error: null as string | null,
    codeToEdit: null as PayrollEarningCode | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchEarningCodes() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/payroll-earning-codes`, { headers: this.buildHeaders() });
        if (!response.ok) throw new Error('Failed to load earning codes');
        this.earningCodes = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading earning codes';
      } finally {
        this.isLoading = false;
      }
    },

    async createEarningCode(payload: Partial<PayrollEarningCode>) {
      const response = await fetch(`${API_URL}/payroll-earning-codes`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.errors?.code?.[0] || body.message || 'Create failed');
      }
      await this.fetchEarningCodes();
    },

    async updateEarningCode(id: number, payload: Partial<PayrollEarningCode>) {
      const response = await fetch(`${API_URL}/payroll-earning-codes/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.errors?.name?.[0] || body.message || 'Update failed');
      }
      await this.fetchEarningCodes();
    },

    async deleteEarningCode(id: number) {
      const response = await fetch(`${API_URL}/payroll-earning-codes/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.earningCodes = this.earningCodes.filter((item) => item.id !== id);
    },

    setCodeToEdit(code: PayrollEarningCode | null) {
      this.codeToEdit = code ? { ...code } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(usePayrollEarningCodeStore, import.meta.hot));
}
