import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeePoolPoint {
  id: string;
  employee_id: string;
  pool_distribution_type_id: number;
  points: number | string;
  weight: number | string;
  effective_date: string;
  end_date?: string | null;
  notes?: string | null;
  pool_distribution_type?: {
    id: number;
    code: string;
    name: string;
  };
  poolDistributionType?: {
    id: number;
    code: string;
    name: string;
  };
}

export interface EmployeePoolPointPayload {
  employee_id: string;
  pool_distribution_type_id: number;
  points: number;
  weight?: number;
  effective_date: string;
  end_date?: string | null;
  notes?: string | null;
}

export interface HoursBankSummary {
  balanceHours: number;
  ledger: Array<{
    id: string;
    entryDate: string | null;
    weekStartDate: string | null;
    entryType: string;
    hoursDelta: number;
    balanceAfter: number;
    expectedHours: number | null;
    workedHours: number | null;
    notes: string | null;
  }>;
}

export const useEmployeePoolStore = defineStore('employee-pool', {
  state: () => ({
    points: [] as EmployeePoolPoint[],
    isLoadingPoints: false,
    hoursBank: null as HoursBankSummary | null,
    isLoadingHoursBank: false,
    error: null as string | null,
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

    async fetchPoints(employeeId: string) {
      this.isLoadingPoints = true;
      this.error = null;
      try {
        const query = new URLSearchParams({
          employeeId,
          per_page: '100',
        });
        const response = await fetch(`${API_URL}/employee-pool-points?${query}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load pool points.');
        const data = await response.json();
        this.points = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load pool points.';
        throw error;
      } finally {
        this.isLoadingPoints = false;
      }
    },

    async createPoint(payload: EmployeePoolPointPayload) {
      const response = await fetch(`${API_URL}/employee-pool-points`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to save pool points.');
      }
      return response.json();
    },

    async updatePoint(id: string, payload: Partial<EmployeePoolPointPayload>) {
      const response = await fetch(`${API_URL}/employee-pool-points/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update pool points.');
      return response.json();
    },

    async deletePoint(id: string) {
      const response = await fetch(`${API_URL}/employee-pool-points/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to delete pool points.');
    },

    async fetchHoursBank(employeeId: string) {
      this.isLoadingHoursBank = true;
      try {
        const response = await fetch(`${API_URL}/employees/${employeeId}/hours-bank`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load hours bank.');
        const data = await response.json();
        this.hoursBank = {
          balanceHours: Number(data.balanceHours ?? 0),
          ledger: data.ledger ?? [],
        };
        return this.hoursBank;
      } finally {
        this.isLoadingHoursBank = false;
      }
    },

    async adjustHoursBank(employeeId: string, hoursDelta: number, notes?: string) {
      const response = await fetch(`${API_URL}/employees/${employeeId}/hours-bank/adjust`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({ hours_delta: hoursDelta, notes }),
      });
      if (!response.ok) throw new Error('Failed to adjust hours bank.');
      const data = await response.json();
      this.hoursBank = data.data ?? {
        balanceHours: Number(data.balanceHours ?? 0),
        ledger: [],
      };
      return this.hoursBank;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeePoolStore, import.meta.hot));
}
