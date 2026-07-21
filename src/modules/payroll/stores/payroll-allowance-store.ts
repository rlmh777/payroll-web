import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { Allowance, Account } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PayrollAllowanceEmployeeOption {
  id: string;
  code?: string | null;
  firstName?: string;
  lastName?: string;
  displayName: string;
}

export interface PayrollAllowanceDraftRun {
  id: string;
  status: string;
  payPeriodSchedule?: {
    startDate?: string;
    endDate?: string;
    payPeriodGroup?: { name?: string } | null;
  } | null;
  payrateFrequency?: { name?: string } | null;
}

export interface HistoricalEmployeeAllowance {
  id: string;
  employeeId: string;
  employee_id?: string;
  allowanceId: string;
  allowance_id?: string;
  accountId: string;
  account_id?: string;
  payrollRunId?: string;
  payroll_run_id: string;
  quantity: number;
  unitAmount: number;
  amount: number;
  note?: string | null;
  employee?: {
    id: string;
    code?: string | null;
    firstName?: string;
    lastName?: string;
  } | null;
  allowance?: Allowance | null;
  chart_of_account?: Account | null;
  payroll_run?: PayrollAllowanceDraftRun | null;
}

interface PayrollAllowancePayload {
  employeeId: string;
  allowanceId: string;
  accountId: string;
  payrollRunId: string;
  quantity: number;
  unitAmount: number;
  note?: string;
}

function authHeaders(): HeadersInit {
  const authStore = useAuthStore();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
  }
  return headers;
}

function extractError(body: Record<string, unknown>, fallback: string): string {
  if (typeof body.message === 'string' && body.message) {
    return body.message;
  }
  const errors = body.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, string[] | string>)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return fallback;
}

export const usePayrollAllowanceStore = defineStore('payrollAllowance', {
  state: () => ({
    allowances: [] as HistoricalEmployeeAllowance[],
    draftRuns: [] as PayrollAllowanceDraftRun[],
    employees: [] as PayrollAllowanceEmployeeOption[],
    allowanceOptions: [] as Allowance[],
    accountOptions: [] as Account[],
    selectedPayrollRunId: null as string | null,
    selectedEmployeeId: null as string | null,
    search: '',
    isBootstrapping: false,
    isLoading: false,
    isSaving: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
  }),

  getters: {
    selectedPayrollRun(state): PayrollAllowanceDraftRun | null {
      return state.draftRuns.find((run) => run.id === state.selectedPayrollRunId) ?? null;
    },
  },

  actions: {
    async bootstrap() {
      this.isBootstrapping = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/historical-employee-allowances/bootstrap`, {
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to load payroll allowance options.'));
        }

        const data = await response.json();
        this.draftRuns = data.draftRuns ?? [];
        this.employees = data.employees ?? [];
        this.allowanceOptions = data.allowances ?? [];
        this.accountOptions = data.accounts ?? [];

        if (!this.selectedPayrollRunId && this.draftRuns[0]) {
          this.selectedPayrollRunId = this.draftRuns[0].id;
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load payroll allowance options.';
      } finally {
        this.isBootstrapping = false;
      }
    },

    async fetchAllowances(page?: number, perPage = 25) {
      if (!this.selectedPayrollRunId) {
        this.allowances = [];
        this.total = 0;
        return;
      }

      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({
          payroll_run_id: this.selectedPayrollRunId,
          page: String(page ?? this.currentPage),
          per_page: String(perPage),
        });
        if (this.selectedEmployeeId) {
          params.append('employee_id', this.selectedEmployeeId);
        }
        if (this.search.trim()) {
          params.append('search', this.search.trim());
        }

        const response = await fetch(`${API_URL}/historical-employee-allowances?${params}`, {
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to load payroll allowances.'));
        }

        const data = await response.json();
        this.allowances = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load payroll allowances.';
        this.allowances = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createAllowance(payload: PayrollAllowancePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/historical-employee-allowances`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to create payroll allowance.'));
        }
        await this.fetchAllowances(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create payroll allowance.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateAllowance(id: string, payload: Partial<PayrollAllowancePayload>) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/historical-employee-allowances/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to update payroll allowance.'));
        }
        await this.fetchAllowances(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update payroll allowance.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteAllowance(id: string) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/historical-employee-allowances/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to delete payroll allowance.'));
        }
        await this.fetchAllowances(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete payroll allowance.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePayrollAllowanceStore, import.meta.hot));
}
