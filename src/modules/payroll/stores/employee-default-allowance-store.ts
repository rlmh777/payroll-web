import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import { useEmployeeStore } from '../../hr/stores/employee-store';
import type { EmployeeDefaultAllowance } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateEmployeeDefaultAllowanceBody {
  employeeId: string;
  allowanceId: string;
  accountId: string;
  note: string;
  quantity: number;
  unitAmount: number;
  amount: number;
}

interface UpdateEmployeeDefaultAllowanceBody {
  employeeId?: string;
  allowanceId?: string;
  accountId?: string;
  note?: string;
  quantity?: number;
  unitAmount?: number;
  amount?: number;
}

function extractErrorMessage(errorData: ApiErrorData, fallback: string): string {
  let errorMessage = errorData.error || fallback;
  if (errorData.errors) {
    const errorKeys = Object.keys(errorData.errors);
    if (errorKeys.length > 0 && errorKeys[0]) {
      const firstError = errorData.errors[errorKeys[0]];
      if (Array.isArray(firstError) && firstError[0]) {
        errorMessage = firstError[0];
      } else if (typeof firstError === 'string') {
        errorMessage = firstError;
      }
    }
  }
  return errorMessage;
}

export const useEmployeeDefaultAllowanceStore = defineStore('employeeDefaultAllowance', {
  state: () => ({
    employeeDefaultAllowances: [] as EmployeeDefaultAllowance[],
    isLoading: false,
    isLoadingEmployeeDefaultAllowances: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      allowanceId: null as string | null,
      accountId: null as string | null,
    },
  }),

  actions: {
    async fetchEmployeeDefaultAllowances(page?: number, perPage?: number) {
      if (this.isLoadingEmployeeDefaultAllowances) return;

      this.isLoadingEmployeeDefaultAllowances = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const employeeStore = useEmployeeStore();
        const queryParams = new URLSearchParams();

        if (employeeStore.selectedEmployee?.id) {
          queryParams.append('employee_id', employeeStore.selectedEmployee.id);
        }

        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.allowanceId) {
          queryParams.append('allowance_id', this.searchFilters.allowanceId);
        }
        if (this.searchFilters.accountId) {
          queryParams.append('account_id', this.searchFilters.accountId);
        }

        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 20;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employee-default-allowances?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employee default allowances: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          this.employeeDefaultAllowances = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          this.employeeDefaultAllowances = data;
        } else {
          this.employeeDefaultAllowances = [];
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error fetching employee default allowances';
      } finally {
        this.isLoadingEmployeeDefaultAllowances = false;
      }
    },

    async createEmployeeDefaultAllowance(
      employeeId: string,
      allowanceId: string,
      accountId: string,
      note: string,
      quantity: number,
      unitAmount: number,
    ): Promise<EmployeeDefaultAllowance | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const amount = Math.round(quantity * unitAmount * 100) / 100;
        const body: CreateEmployeeDefaultAllowanceBody = {
          employeeId,
          allowanceId,
          accountId,
          note,
          quantity,
          unitAmount,
          amount,
        };

        const response = await fetch(`${API_URL}/employee-default-allowances`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          const error = new Error(
            extractErrorMessage(errorData, `Failed to create employee default allowance: ${response.statusText}`),
          ) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const newEmployeeDefaultAllowance = result.data || result;
        this.employeeDefaultAllowances = [...this.employeeDefaultAllowances, newEmployeeDefaultAllowance];
        return newEmployeeDefaultAllowance;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating employee default allowance';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateEmployeeDefaultAllowance(
      id: string,
      payload: UpdateEmployeeDefaultAllowanceBody,
    ): Promise<EmployeeDefaultAllowance | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const body = { ...payload };
        if (body.quantity != null && body.unitAmount != null) {
          body.amount = Math.round(body.quantity * body.unitAmount * 100) / 100;
        }

        const response = await fetch(`${API_URL}/employee-default-allowances/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          const error = new Error(
            extractErrorMessage(errorData, `Failed to update employee default allowance: ${response.statusText}`),
          ) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const updatedEmployeeDefaultAllowance = result.data || result;
        const index = this.employeeDefaultAllowances.findIndex((eda) => eda.id === id);
        if (index !== -1) {
          this.employeeDefaultAllowances[index] = updatedEmployeeDefaultAllowance;
        }

        return updatedEmployeeDefaultAllowance;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating employee default allowance';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteEmployeeDefaultAllowance(id: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employee-default-allowances/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete employee default allowance: ${response.statusText}`);
        }

        this.employeeDefaultAllowances = this.employeeDefaultAllowances.filter((eda) => eda.id !== id);
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting employee default allowance';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeDefaultAllowanceStore, import.meta.hot));
}
