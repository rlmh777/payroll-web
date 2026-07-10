import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { ContractLeaveEntitlementRow, LeaveAccrualMethod } from 'src/components/settings/leave/leave-type-form';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface ContractEntitlementPayload {
  leaveTypeId: number;
  annualEntitlementDays?: number | null;
  accrualMethod?: LeaveAccrualMethod | null;
  useOrgDefault: boolean;
}

export const useEmploymentLeaveEntitlementStore = defineStore('employmentLeaveEntitlement', {
  state: () => ({
    rows: [] as ContractLeaveEntitlementRow[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchByContract(employmentDetailId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/employment-details/${employmentDetailId}/leave-entitlements`,
          { headers: this.buildHeaders() },
        );

        if (!response.ok) throw new Error('Failed to load contract leave entitlements');

        const body = await response.json();
        this.rows = (Array.isArray(body.data) ? body.data : []).map((row: ContractLeaveEntitlementRow) => ({
          ...row,
          useOrgDefault: !row.usesContractOverride,
        }));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading entitlements';
        this.rows = [];
      } finally {
        this.isLoading = false;
      }
    },

    async save(employmentDetailId: string, entitlements: ContractEntitlementPayload[]) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/employment-details/${employmentDetailId}/leave-entitlements`,
          {
            method: 'PUT',
            headers: this.buildHeaders(),
            body: JSON.stringify({ entitlements }),
          },
        );

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(typeof body.message === 'string' ? body.message : 'Save failed');
        }

        const body = await response.json();
        this.rows = (Array.isArray(body.data) ? body.data : []).map((row: ContractLeaveEntitlementRow) => ({
          ...row,
          useOrgDefault: !row.usesContractOverride,
        }));
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmploymentLeaveEntitlementStore, import.meta.hot));
}
