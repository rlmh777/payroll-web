import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { PayrateFrequency } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  message?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

function extractErrorMessage(errorData: ApiErrorData, fallback: string): string {
  let errorMessage = errorData.error || errorData.message || fallback;
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

export const usePayrateFrequencyStore = defineStore('payrateFrequency', {
  state: () => ({
    payrateFrequencies: [] as PayrateFrequency[],
    isLoading: false,
    isLoadingPayrateFrequencies: false,
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
    async fetchPayrateFrequencies(page?: number, perPage?: number, search?: string) {
      if (this.isLoadingPayrateFrequencies) return;

      this.isLoadingPayrateFrequencies = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        const searchTerm = search ?? this.searchFilters.search;
        if (searchTerm) {
          queryParams.append('search', searchTerm);
        }

        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 100;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/payrate-frequencies?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pay rate frequencies: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.data && Array.isArray(data.data)) {
          this.payrateFrequencies = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          this.payrateFrequencies = data;
        } else {
          this.payrateFrequencies = [];
        }
      } catch (error) {
        console.error('Error fetching pay rate frequencies:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching pay rate frequencies';
        this.payrateFrequencies = [];
      } finally {
        this.isLoadingPayrateFrequencies = false;
      }
    },

    async createPayrateFrequency(name: string): Promise<PayrateFrequency | null> {
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

        const response = await fetch(`${API_URL}/payrate-frequencies`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          const error = new Error(
            extractErrorMessage(errorData, `Failed to create pay rate frequency: ${response.statusText}`)
          ) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const newPayrateFrequency = result.data || result;
        this.payrateFrequencies = [...this.payrateFrequencies, newPayrateFrequency];

        return newPayrateFrequency;
      } catch (error) {
        console.error('Error creating pay rate frequency:', error);
        this.error = error instanceof Error ? error.message : 'Error creating pay rate frequency';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updatePayrateFrequency(id: number, name: string): Promise<PayrateFrequency | null> {
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

        const response = await fetch(`${API_URL}/payrate-frequencies/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          const error = new Error(
            extractErrorMessage(errorData, `Failed to update pay rate frequency: ${response.statusText}`)
          ) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const updatedPayrateFrequency = result.data || result;

        const index = this.payrateFrequencies.findIndex((f) => f.id === id);
        if (index !== -1) {
          this.payrateFrequencies[index] = updatedPayrateFrequency;
        }

        return updatedPayrateFrequency;
      } catch (error) {
        console.error('Error updating pay rate frequency:', error);
        this.error = error instanceof Error ? error.message : 'Error updating pay rate frequency';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deletePayrateFrequency(id: number): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/payrate-frequencies/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          throw new Error(
            extractErrorMessage(errorData, `Failed to delete pay rate frequency: ${response.statusText}`)
          );
        }

        this.payrateFrequencies = this.payrateFrequencies.filter((f) => f.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting pay rate frequency:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting pay rate frequency';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePayrateFrequencyStore, import.meta.hot));
}
