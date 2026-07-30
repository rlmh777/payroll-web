import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { Allowance } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateAllowanceBody {
  name: string;
  isTaxable?: boolean;
  isSocialSecurityDeductable?: boolean;
  note?: string | null;
  defaultAmount: number;
}

interface UpdateAllowanceBody {
  name?: string;
  isTaxable?: boolean;
  isSocialSecurityDeductable?: boolean;
  note?: string | null;
  defaultAmount?: number;
}

export const useAllowanceStore = defineStore('allowance', {
  state: () => ({
    allowances: [] as Allowance[],
    isLoading: false,
    isLoadingAllowances: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      isTaxable: null as boolean | null,
      isSocialSecurityDeductable: null as boolean | null,
      minAmount: null as number | null,
      maxAmount: null as number | null,
    },
  }),

  getters: {},

  actions: {
    async fetchAllowances(page?: number, perPage?: number) {
      if (this.isLoadingAllowances) return;

      this.isLoadingAllowances = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.isTaxable !== null) {
          queryParams.append('isTaxable', this.searchFilters.isTaxable.toString());
        }
        if (this.searchFilters.isSocialSecurityDeductable !== null) {
          queryParams.append('isSocialSecurityDeductable', this.searchFilters.isSocialSecurityDeductable.toString());
        }
        if (this.searchFilters.minAmount !== null) {
          queryParams.append('min_amount', this.searchFilters.minAmount.toString());
        }
        if (this.searchFilters.maxAmount !== null) {
          queryParams.append('max_amount', this.searchFilters.maxAmount.toString());
        }

        // Add pagination parameters
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

        const response = await fetch(`${API_URL}/allowances?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch allowances: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.allowances = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.allowances = data;
        } else {
          this.allowances = [];
        }
      } catch (error) {
        console.error('Error fetching allowances:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching allowances';
      } finally {
        this.isLoadingAllowances = false;
      }
    },

    async createAllowance(
      name: string,
      defaultAmount: number,
      isTaxable?: boolean,
      isSocialSecurityDeductable?: boolean,
      note?: string | null
    ): Promise<Allowance | null> {
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

        const body: CreateAllowanceBody = {
          name,
          defaultAmount,
        };

        if (isTaxable !== undefined) {
          body.isTaxable = isTaxable;
        }
        if (isSocialSecurityDeductable !== undefined) {
          body.isSocialSecurityDeductable = isSocialSecurityDeductable;
        }
        if (note !== undefined && note !== null) {
          body.note = note;
        }

        const response = await fetch(`${API_URL}/allowances`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create allowance: ${response.statusText}`;
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
        const newAllowance = result.data || result;

        // Add to allowances list
        this.allowances = [...this.allowances, newAllowance];

        return newAllowance;
      } catch (error) {
        console.error('Error creating allowance:', error);
        this.error = error instanceof Error ? error.message : 'Error creating allowance';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateAllowance(
      id: string,
      name?: string,
      defaultAmount?: number,
      isTaxable?: boolean,
      isSocialSecurityDeductable?: boolean,
      note?: string | null
    ): Promise<Allowance | null> {
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

        const body: UpdateAllowanceBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (defaultAmount !== undefined) {
          body.defaultAmount = defaultAmount;
        }
        if (isTaxable !== undefined) {
          body.isTaxable = isTaxable;
        }
        if (isSocialSecurityDeductable !== undefined) {
          body.isSocialSecurityDeductable = isSocialSecurityDeductable;
        }
        if (note !== undefined) {
          body.note = note;
        }

        const response = await fetch(`${API_URL}/allowances/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update allowance: ${response.statusText}`;
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
        const updatedAllowance = result.data || result;

        // Update in allowances list
        const index = this.allowances.findIndex((a) => a.id === id);
        if (index !== -1) {
          this.allowances[index] = updatedAllowance;
        }

        return updatedAllowance;
      } catch (error) {
        console.error('Error updating allowance:', error);
        this.error = error instanceof Error ? error.message : 'Error updating allowance';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAllowance(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/allowances/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete allowance: ${response.statusText}`);
        }

        // Remove from allowances list
        this.allowances = this.allowances.filter((a) => a.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting allowance:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting allowance';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAllowanceStore, import.meta.hot));
}

