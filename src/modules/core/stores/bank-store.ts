import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { Bank } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateBankBody {
  name: string;
  code?: string | null;
}

interface UpdateBankBody {
  name?: string;
  code?: string | null;
}

export const useBankStore = defineStore('bank', {
  state: () => ({
    banks: [] as Bank[],
    isLoading: false,
    isLoadingBanks: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchBanks(page?: number, perPage?: number) {
      if (this.isLoadingBanks) return;

      this.isLoadingBanks = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
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

        const response = await fetch(`${API_URL}/banks?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch banks: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.banks = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.banks = data;
        } else {
          this.banks = [];
        }
      } catch (error) {
        console.error('Error fetching banks:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching banks';
      } finally {
        this.isLoadingBanks = false;
      }
    },

    async createBank(
      name: string,
      code?: string | null
    ): Promise<Bank | null> {
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

        const body: CreateBankBody = {
          name,
        };

        if (code !== undefined && code !== null) {
          body.code = code;
        }

        const response = await fetch(`${API_URL}/banks`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create bank: ${response.statusText}`;
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
        const newBank = result.data || result;

        // Add to banks list
        this.banks = [...this.banks, newBank];

        return newBank;
      } catch (error) {
        console.error('Error creating bank:', error);
        this.error = error instanceof Error ? error.message : 'Error creating bank';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateBank(
      id: string,
      name?: string,
      code?: string | null
    ): Promise<Bank | null> {
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

        const body: UpdateBankBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (code !== undefined) {
          body.code = code;
        }

        const response = await fetch(`${API_URL}/banks/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update bank: ${response.statusText}`;
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
        const updatedBank = result.data || result;

        // Update in banks list
        const index = this.banks.findIndex((b) => b.id === id);
        if (index !== -1) {
          this.banks[index] = updatedBank;
        }

        return updatedBank;
      } catch (error) {
        console.error('Error updating bank:', error);
        this.error = error instanceof Error ? error.message : 'Error updating bank';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteBank(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/banks/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete bank: ${response.statusText}`);
        }

        // Remove from banks list
        this.banks = this.banks.filter((b) => b.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting bank:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting bank';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBankStore, import.meta.hot));
}

