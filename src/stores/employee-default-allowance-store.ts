import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { useEmployeeStore } from './employee-store';
import type { EmployeeDefaultAllowance } from '../components/models';

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
  frequencyId: number;
  accountId: string;
  note: string;
  amount: number;
}

interface UpdateEmployeeDefaultAllowanceBody {
  employeeId?: string;
  allowanceId?: string;
  frequencyId?: number;
  accountId?: string;
  note?: string;
  amount?: number;
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
      frequencyId: null as number | null,
      accountId: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchEmployeeDefaultAllowances(page?: number, perPage?: number) {
      if (this.isLoadingEmployeeDefaultAllowances) return;

      this.isLoadingEmployeeDefaultAllowances = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const employeeStore = useEmployeeStore();
        const queryParams = new URLSearchParams();

        // Add employee filter if selected
        if (employeeStore.selectedEmployee?.id) {
          queryParams.append('employee_id', employeeStore.selectedEmployee.id);
        }

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.allowanceId) {
          queryParams.append('allowance_id', this.searchFilters.allowanceId);
        }
        if (this.searchFilters.frequencyId) {
          queryParams.append('frequency_id', String(this.searchFilters.frequencyId));
        }
        if (this.searchFilters.accountId) {
          queryParams.append('account_id', this.searchFilters.accountId);
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 10;
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

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.employeeDefaultAllowances = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.employeeDefaultAllowances = data;
        } else {
          this.employeeDefaultAllowances = [];
        }
      } catch (error) {
        console.error('Error fetching employee default allowances:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching employee default allowances';
      } finally {
        this.isLoadingEmployeeDefaultAllowances = false;
      }
    },

    async createEmployeeDefaultAllowance(
      employeeId: string,
      allowanceId: string,
      frequencyId: number,
      accountId: string,
      note: string,
      amount: number
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

        const body: CreateEmployeeDefaultAllowanceBody = {
          employeeId,
          allowanceId,
          frequencyId,
          accountId,
          note,
          amount,
        };

        const response = await fetch(`${API_URL}/employee-default-allowances`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create employee default allowance: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const newEmployeeDefaultAllowance = result.data || result;

        // Add to employee default allowances list
        this.employeeDefaultAllowances = [...this.employeeDefaultAllowances, newEmployeeDefaultAllowance];

        return newEmployeeDefaultAllowance;
      } catch (error) {
        console.error('Error creating employee default allowance:', error);
        this.error = error instanceof Error ? error.message : 'Error creating employee default allowance';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateEmployeeDefaultAllowance(
      id: string,
      employeeId?: string,
      allowanceId?: string,
      frequencyId?: number,
      accountId?: string,
      note?: string,
      amount?: number
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

        const body: UpdateEmployeeDefaultAllowanceBody = {};

        if (employeeId !== undefined) {
          body.employeeId = employeeId;
        }
        if (allowanceId !== undefined) {
          body.allowanceId = allowanceId;
        }
        if (frequencyId !== undefined) {
          body.frequencyId = frequencyId;
        }
        if (accountId !== undefined) {
          body.accountId = accountId;
        }
        if (note !== undefined) {
          body.note = note;
        }
        if (amount !== undefined) {
          body.amount = amount;
        }

        const response = await fetch(`${API_URL}/employee-default-allowances/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update employee default allowance: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const updatedEmployeeDefaultAllowance = result.data || result;

        // Update in employee default allowances list
        const index = this.employeeDefaultAllowances.findIndex((eda) => eda.id === id);
        if (index !== -1) {
          this.employeeDefaultAllowances[index] = updatedEmployeeDefaultAllowance;
        }

        return updatedEmployeeDefaultAllowance;
      } catch (error) {
        console.error('Error updating employee default allowance:', error);
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

        // Remove from employee default allowances list
        this.employeeDefaultAllowances = this.employeeDefaultAllowances.filter((eda) => eda.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting employee default allowance:', error);
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

