import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PersonalRelief {
  id: string;
  startRange: number;
  endRange: number;
  personalRelief: number;
  created_at?: string;
  updated_at?: string;
}

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreatePersonalReliefBody {
  startRange: number;
  endRange: number;
  personalRelief: number;
}

interface UpdatePersonalReliefBody {
  startRange?: number;
  endRange?: number;
  personalRelief?: number;
}

export const usePersonalReliefStore = defineStore('personalRelief', {
  state: () => ({
    personalReliefs: [] as PersonalRelief[],
    isLoading: false,
    isLoadingPersonalReliefs: false,
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
    async fetchPersonalReliefs(page?: number, perPage?: number) {
      if (this.isLoadingPersonalReliefs) return;

      this.isLoadingPersonalReliefs = true;
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
        const itemsPerPage = perPage ?? 10;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/personal-relief?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch personal relief records: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.personalReliefs = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.personalReliefs = data;
        } else {
          this.personalReliefs = [];
        }
      } catch (error) {
        console.error('Error fetching personal relief records:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching personal relief records';
      } finally {
        this.isLoadingPersonalReliefs = false;
      }
    },

    async createPersonalRelief(
      startRange: number,
      endRange: number,
      personalRelief: number
    ): Promise<PersonalRelief | null> {
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

        const body: CreatePersonalReliefBody = {
          startRange,
          endRange,
          personalRelief,
        };

        const response = await fetch(`${API_URL}/personal-relief`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create personal relief record: ${response.statusText}`;
          if (errorData.errors) {
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
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const newRecord = result.data || result;

        // Add to list
        this.personalReliefs = [...this.personalReliefs, newRecord];

        return newRecord;
      } catch (error) {
        console.error('Error creating personal relief record:', error);
        this.error = error instanceof Error ? error.message : 'Error creating personal relief record';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updatePersonalRelief(
      id: string,
      startRange?: number,
      endRange?: number,
      personalRelief?: number
    ): Promise<PersonalRelief | null> {
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

        const body: UpdatePersonalReliefBody = {};

        if (startRange !== undefined) {
          body.startRange = startRange;
        }
        if (endRange !== undefined) {
          body.endRange = endRange;
        }
        if (personalRelief !== undefined) {
          body.personalRelief = personalRelief;
        }

        const response = await fetch(`${API_URL}/personal-relief/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to update personal relief record: ${response.statusText}`;
          if (errorData.errors) {
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
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const updatedRecord = result.data || result;

        // Update in list
        const index = this.personalReliefs.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.personalReliefs[index] = updatedRecord;
        }

        return updatedRecord;
      } catch (error) {
        console.error('Error updating personal relief record:', error);
        this.error = error instanceof Error ? error.message : 'Error updating personal relief record';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deletePersonalRelief(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/personal-relief/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to delete personal relief record: ${response.statusText}`);
        }

        // Remove from list
        this.personalReliefs = this.personalReliefs.filter((r) => r.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting personal relief record:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting personal relief record';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

