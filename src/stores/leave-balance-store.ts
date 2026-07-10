import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { LeaveBalanceRow } from 'src/components/settings/leave/leave-type-form';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useLeaveBalanceStore = defineStore('leaveBalance', {
  state: () => ({
    balances: [] as LeaveBalanceRow[],
    asOf: '' as string,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchByEmployee(employeeId: string, asOf?: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ employeeId });
        if (asOf) params.set('asOf', asOf);

        const response = await fetch(`${API_URL}/employee-leave-balances?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to load leave balances');

        const body = await response.json();
        this.balances = Array.isArray(body.data) ? body.data as LeaveBalanceRow[] : [];
        this.asOf = body.asOf ?? '';
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading leave balances';
        this.balances = [];
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLeaveBalanceStore, import.meta.hot));
}
