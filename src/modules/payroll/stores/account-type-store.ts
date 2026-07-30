import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { AccountType } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateAccountTypeBody {
  name: string;
  normal_balance?: string | null;
  statement?: string | null;
}

interface UpdateAccountTypeBody {
  name?: string;
  normal_balance?: string | null;
  statement?: string | null;
}

export const useAccountTypeStore = defineStore('accountType', {
  state: () => ({
    accountTypes: [] as AccountType[],
    isLoading: false,
    isLoadingAccountTypes: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      statement: null as string | null,
      normal_balance: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchAccountTypes(page?: number, perPage?: number) {
      if (this.isLoadingAccountTypes) return;

      this.isLoadingAccountTypes = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.statement) {
          queryParams.append('statement', this.searchFilters.statement);
        }
        if (this.searchFilters.normal_balance) {
          queryParams.append('normal_balance', this.searchFilters.normal_balance);
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

        const response = await fetch(`${API_URL}/account-types?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch account types: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.accountTypes = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.accountTypes = data;
        } else {
          this.accountTypes = [];
        }
      } catch (error) {
        console.error('Error fetching account types:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching account types';
      } finally {
        this.isLoadingAccountTypes = false;
      }
    },

    async createAccountType(
      name: string,
      normal_balance?: string | null,
      statement?: string | null
    ): Promise<AccountType | null> {
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

        const body: CreateAccountTypeBody = {
          name,
        };

        if (normal_balance !== undefined) {
          body.normal_balance = normal_balance;
        }
        if (statement !== undefined) {
          body.statement = statement;
        }

        const response = await fetch(`${API_URL}/account-types`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create account type: ${response.statusText}`;
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
        const newAccountType = result.data || result;

        // Add to account types list
        this.accountTypes = [...this.accountTypes, newAccountType];

        return newAccountType;
      } catch (error) {
        console.error('Error creating account type:', error);
        this.error = error instanceof Error ? error.message : 'Error creating account type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateAccountType(
      id: number,
      name?: string,
      normal_balance?: string | null,
      statement?: string | null
    ): Promise<AccountType | null> {
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

        const body: UpdateAccountTypeBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (normal_balance !== undefined) {
          body.normal_balance = normal_balance;
        }
        if (statement !== undefined) {
          body.statement = statement;
        }

        const response = await fetch(`${API_URL}/account-types/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update account type: ${response.statusText}`;
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
        const updatedAccountType = result.data || result;

        // Update in account types list
        const index = this.accountTypes.findIndex((a) => a.id === id);
        if (index !== -1) {
          this.accountTypes[index] = updatedAccountType;
        }

        return updatedAccountType;
      } catch (error) {
        console.error('Error updating account type:', error);
        this.error = error instanceof Error ? error.message : 'Error updating account type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAccountType(id: number): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/account-types/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete account type: ${response.statusText}`);
        }

        // Remove from account types list
        this.accountTypes = this.accountTypes.filter((a) => a.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting account type:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting account type';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountTypeStore, import.meta.hot));
}

