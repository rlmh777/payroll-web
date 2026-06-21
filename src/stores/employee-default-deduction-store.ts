import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { useEmployeeStore } from './employee-store';
import type { EmployeeDefaultDeduction } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

export interface EmployeeDefaultDeductionFields {
  allowPartialDeduction?: boolean;
  applicationRule?: string | null;
  priority?: number;
}

interface CreateEmployeeDefaultDeductionBody {
  employeeId: string;
  deductionTypeId: number;
  bankId: string;
  accountNumber: string;
  frequencyId: number;
  accountId: string;
  note?: string | null;
  amount: number;
  allowPartialDeduction?: boolean;
  applicationRule?: string | null;
  priority?: number;
}

interface UpdateEmployeeDefaultDeductionBody {
  employeeId?: string;
  deductionTypeId?: number;
  bankId?: string;
  accountNumber?: string;
  frequencyId?: number;
  accountId?: string;
  note?: string | null;
  amount?: number;
  allowPartialDeduction?: boolean;
  applicationRule?: string | null;
  priority?: number;
}

export const useEmployeeDefaultDeductionStore = defineStore('employeeDefaultDeduction', {
  state: () => ({
    employeeDefaultDeductions: [] as EmployeeDefaultDeduction[],
    isLoading: false,
    isLoadingEmployeeDefaultDeductions: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      deductionTypeId: null as number | null,
      frequencyId: null as number | null,
      accountId: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchEmployeeDefaultDeductions(page?: number, perPage?: number) {
      if (this.isLoadingEmployeeDefaultDeductions) return;

      this.isLoadingEmployeeDefaultDeductions = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const employeeStore = useEmployeeStore();
        const queryParams = new URLSearchParams();

        // Add employee filter if selected
        if (employeeStore.selectedEmployee?.id) {
          queryParams.append('employeeId', employeeStore.selectedEmployee.id);
        }

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.deductionTypeId) {
          queryParams.append('deductionId', this.searchFilters.deductionTypeId.toString());
        }
        // Note: API uses 'deductionId' for filtering but 'deductionTypeId' in the body
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

        const response = await fetch(`${API_URL}/employee-default-deductions?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employee default deductions: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.employeeDefaultDeductions = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.employeeDefaultDeductions = data;
        } else {
          this.employeeDefaultDeductions = [];
        }
      } catch (error) {
        console.error('Error fetching employee default deductions:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching employee default deductions';
      } finally {
        this.isLoadingEmployeeDefaultDeductions = false;
      }
    },

    async createEmployeeDefaultDeduction(
      employeeId: string,
      deductionTypeId: number,
      bankId: string,
      accountNumber: string,
      frequencyId: number,
      accountId: string,
      note: string | null,
      amount: number,
      fields?: EmployeeDefaultDeductionFields
    ): Promise<EmployeeDefaultDeduction | null> {
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

        const body: CreateEmployeeDefaultDeductionBody = {
          employeeId,
          deductionTypeId,
          bankId,
          accountNumber,
          frequencyId,
          accountId,
          note,
          amount,
          allowPartialDeduction: fields?.allowPartialDeduction ?? false,
          applicationRule: fields?.applicationRule ?? null,
          priority: fields?.priority ?? 0,
        };

        const response = await fetch(`${API_URL}/employee-default-deductions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create employee default deduction: ${response.statusText}`;
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
        const newEmployeeDefaultDeduction = result.data || result;

        // Add to employee default deductions list
        this.employeeDefaultDeductions = [...this.employeeDefaultDeductions, newEmployeeDefaultDeduction];

        return newEmployeeDefaultDeduction;
      } catch (error) {
        console.error('Error creating employee default deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error creating employee default deduction';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateEmployeeDefaultDeduction(
      id: string,
      employeeId?: string,
      deductionTypeId?: number,
      bankId?: string,
      accountNumber?: string,
      frequencyId?: number,
      accountId?: string,
      note?: string | null,
      amount?: number,
      fields?: EmployeeDefaultDeductionFields
    ): Promise<EmployeeDefaultDeduction | null> {
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

        const body: UpdateEmployeeDefaultDeductionBody = {};

        if (employeeId !== undefined) {
          body.employeeId = employeeId;
        }
        if (deductionTypeId !== undefined) {
          body.deductionTypeId = deductionTypeId;
        }
        if (bankId !== undefined) {
          body.bankId = bankId;
        }
        if (accountNumber !== undefined) {
          body.accountNumber = accountNumber;
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
        if (fields?.allowPartialDeduction !== undefined) {
          body.allowPartialDeduction = fields.allowPartialDeduction;
        }
        if (fields?.applicationRule !== undefined) {
          body.applicationRule = fields.applicationRule;
        }
        if (fields?.priority !== undefined) {
          body.priority = fields.priority;
        }

        const response = await fetch(`${API_URL}/employee-default-deductions/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update employee default deduction: ${response.statusText}`;
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
        const updatedEmployeeDefaultDeduction = result.data || result;

        // Update in employee default deductions list
        const index = this.employeeDefaultDeductions.findIndex((edd) => edd.id === id);
        if (index !== -1) {
          this.employeeDefaultDeductions[index] = updatedEmployeeDefaultDeduction;
        }

        return updatedEmployeeDefaultDeduction;
      } catch (error) {
        console.error('Error updating employee default deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error updating employee default deduction';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteEmployeeDefaultDeduction(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/employee-default-deductions/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete employee default deduction: ${response.statusText}`);
        }

        // Remove from employee default deductions list
        this.employeeDefaultDeductions = this.employeeDefaultDeductions.filter((edd) => edd.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting employee default deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting employee default deduction';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeDefaultDeductionStore, import.meta.hot));
}

