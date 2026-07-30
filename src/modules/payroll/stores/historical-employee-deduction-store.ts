import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import { useEmployeeStore } from '../../hr/stores/employee-store';
import type { HistoricalEmployeeDeduction } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

export interface HistoricalEmployeeDeductionInput {
  paymentToId: string;
  amount: number;
  note: string;
  payroll_run_id: string;
  accountId: string;
  deductionTypeId: number;
  carryForwardShortfall?: number;
  priority?: number;
}

interface CreateHistoricalEmployeeDeductionBody extends HistoricalEmployeeDeductionInput {
  employeeId: string;
}

interface UpdateHistoricalEmployeeDeductionBody extends Partial<HistoricalEmployeeDeductionInput> {
  employeeId?: string;
}

export const useHistoricalEmployeeDeductionStore = defineStore('historicalEmployeeDeduction', {
  state: () => ({
    historicalEmployeeDeductions: [] as HistoricalEmployeeDeduction[],
    isLoading: false,
    isLoadingHistoricalEmployeeDeductions: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
  }),

  getters: {},

  actions: {
    async fetchHistoricalEmployeeDeductions(page?: number, perPage?: number) {
      if (this.isLoadingHistoricalEmployeeDeductions) return;

      this.isLoadingHistoricalEmployeeDeductions = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const employeeStore = useEmployeeStore();
        const queryParams = new URLSearchParams();

        if (employeeStore.selectedEmployee?.id) {
          queryParams.append('employeeId', employeeStore.selectedEmployee.id);
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

        const response = await fetch(`${API_URL}/historical-employee-deductions?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch historical deductions: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          this.historicalEmployeeDeductions = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          this.historicalEmployeeDeductions = data;
        } else {
          this.historicalEmployeeDeductions = [];
        }
      } catch (error) {
        console.error('Error fetching historical deductions:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching historical deductions';
      } finally {
        this.isLoadingHistoricalEmployeeDeductions = false;
      }
    },

    async createHistoricalEmployeeDeduction(
      employeeId: string,
      input: HistoricalEmployeeDeductionInput
    ): Promise<HistoricalEmployeeDeduction | null> {
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

        const body: CreateHistoricalEmployeeDeductionBody = {
          employeeId,
          ...input,
          carryForwardShortfall: input.carryForwardShortfall ?? 0,
          priority: input.priority ?? 0,
        };

        const response = await fetch(`${API_URL}/historical-employee-deductions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create historical deduction: ${response.statusText}`;
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
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const created = result.data || result;
        this.historicalEmployeeDeductions = [...this.historicalEmployeeDeductions, created];

        return created;
      } catch (error) {
        console.error('Error creating historical deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error creating historical deduction';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateHistoricalEmployeeDeduction(
      id: string,
      input: UpdateHistoricalEmployeeDeductionBody
    ): Promise<HistoricalEmployeeDeduction | null> {
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

        const response = await fetch(`${API_URL}/historical-employee-deductions/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update historical deduction: ${response.statusText}`);
        }

        const result = await response.json();
        const updated = result.data || result;
        const index = this.historicalEmployeeDeductions.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.historicalEmployeeDeductions[index] = updated;
        }

        return updated;
      } catch (error) {
        console.error('Error updating historical deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error updating historical deduction';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteHistoricalEmployeeDeduction(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/historical-employee-deductions/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete historical deduction: ${response.statusText}`);
        }

        this.historicalEmployeeDeductions = this.historicalEmployeeDeductions.filter((item) => item.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting historical deduction:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting historical deduction';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHistoricalEmployeeDeductionStore, import.meta.hot));
}
