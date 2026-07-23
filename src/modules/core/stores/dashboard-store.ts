import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface DashboardKpis {
  currentPayroll: number;
  ytdPayroll: number;
  netPay: number;
  employerCost: number;
  headcountPaid: number;
  overtimeCost: number;
}

export interface DashboardPayload {
  meta: {
    currentPayrollRunId?: string | null;
    currentPeriod?: {
      startDate?: string | null;
      endDate?: string | null;
      label?: string | null;
    } | null;
    asOfDate?: string | null;
    ytdYear?: number;
    hasPostedPayroll?: boolean;
  };
  kpis: DashboardKpis;
  payrollTrend: {
    months: string[];
    labels: string[];
    gross: number[];
    net: number[];
    employerCost: number[];
  };
  departmentShare: Array<{ departmentId: number | null; name: string; value: number }>;
  costByDepartment: {
    departments: string[];
    regular: number[];
    overtime: number[];
    holiday: number[];
    allowances: number[];
  };
  deductionsMix: Array<{ name: string; value: number }>;
  ytdVsCurrentByDepartment: {
    departments: string[];
    current: number[];
    ytd: number[];
  };
  overtimeHeatmap: {
    weeks: string[];
    departments: string[];
    cells: Array<[number, number, number]>;
  };
}

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    data: null as DashboardPayload | null,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { Accept: 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchDashboard(months = 6) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ months: String(months) });
        const response = await fetch(`${API_URL}/dashboard?${params.toString()}`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load dashboard');
        }
        this.data = body as DashboardPayload;
      } catch (error) {
        this.data = null;
        this.error = error instanceof Error ? error.message : 'Failed to load dashboard';
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDashboardStore, import.meta.hot));
}
