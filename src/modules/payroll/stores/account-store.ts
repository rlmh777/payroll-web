import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { Account } from '@core/types/models';
import { flattenAccountsHierarchically } from '@payroll/utils/account-hierarchy';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateAccountBody {
  name: string;
  description?: string | null;
  code1?: string | null;
  code2?: string | null;
  balance?: number | null;
  parent_id?: string | null;
  account_type_id?: number | null;
}

interface UpdateAccountBody {
  name?: string;
  description?: string | null;
  code1?: string | null;
  code2?: string | null;
  balance?: number | null;
  parent_id?: string | null;
  account_type_id?: number | null;
}

export const useAccountStore = defineStore('account', {
  state: () => ({
    accounts: [] as Account[],
    isLoading: false,
    isLoadingAccounts: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      account_type_id: null as number | null,
      parent_id: null as string | null,
      root_only: null as boolean | null,
      sub_accounts_only: null as boolean | null,
    },
  }),

  getters: {},

  actions: {
    async fetchAccounts(page?: number, perPage?: number) {
      if (this.isLoadingAccounts) return;

      this.isLoadingAccounts = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.account_type_id !== null) {
          queryParams.append('account_type_id', this.searchFilters.account_type_id.toString());
        }
        if (this.searchFilters.parent_id !== null) {
          queryParams.append('parent_id', this.searchFilters.parent_id);
        }
        if (this.searchFilters.root_only === true) {
          queryParams.append('root_only', '1');
        }
        if (this.searchFilters.sub_accounts_only === true) {
          queryParams.append('sub_accounts_only', '1');
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 20;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());
        queryParams.append('with_relations', '1');

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/accounts?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response — keep parents above their children within the page
        if (data.data && Array.isArray(data.data)) {
          this.accounts = flattenAccountsHierarchically(data.data);
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          this.accounts = flattenAccountsHierarchically(data);
        } else {
          this.accounts = [];
        }
      } catch (error) {
        console.error('Error fetching accounts:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching accounts';
      } finally {
        this.isLoadingAccounts = false;
      }
    },

    async createAccount(
      name: string,
      description?: string | null,
      code1?: string | null,
      code2?: string | null,
      balance?: number | null,
      parent_id?: string | null,
      account_type_id?: number | null
    ): Promise<Account | null> {
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

        const body: CreateAccountBody = {
          name,
        };

        if (description !== undefined) {
          body.description = description;
        }
        if (code1 !== undefined) {
          body.code1 = code1;
        }
        if (code2 !== undefined) {
          body.code2 = code2;
        }
        if (balance !== undefined) {
          body.balance = balance;
        }
        if (parent_id !== undefined) {
          body.parent_id = parent_id;
        }
        if (account_type_id !== undefined) {
          body.account_type_id = account_type_id;
        }

        const response = await fetch(`${API_URL}/accounts`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create account: ${response.statusText}`;
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
        const newAccount = result.data || result;

        // Add to accounts list
        this.accounts = [...this.accounts, newAccount];

        return newAccount;
      } catch (error) {
        console.error('Error creating account:', error);
        this.error = error instanceof Error ? error.message : 'Error creating account';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateAccount(
      id: string,
      name?: string,
      description?: string | null,
      code1?: string | null,
      code2?: string | null,
      balance?: number | null,
      parent_id?: string | null,
      account_type_id?: number | null
    ): Promise<Account | null> {
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

        const body: UpdateAccountBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (description !== undefined) {
          body.description = description;
        }
        if (code1 !== undefined) {
          body.code1 = code1;
        }
        if (code2 !== undefined) {
          body.code2 = code2;
        }
        if (balance !== undefined) {
          body.balance = balance;
        }
        if (parent_id !== undefined) {
          body.parent_id = parent_id;
        }
        if (account_type_id !== undefined) {
          body.account_type_id = account_type_id;
        }

        const response = await fetch(`${API_URL}/accounts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update account: ${response.statusText}`;
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
        const updatedAccount = result.data || result;

        // Update in accounts list
        const index = this.accounts.findIndex((a) => a.id === id);
        if (index !== -1) {
          this.accounts[index] = updatedAccount;
        }

        return updatedAccount;
      } catch (error) {
        console.error('Error updating account:', error);
        this.error = error instanceof Error ? error.message : 'Error updating account';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAccount(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/accounts/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete account: ${response.statusText}`);
        }

        // Remove from accounts list
        this.accounts = this.accounts.filter((a) => a.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting account:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting account';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAccountStore, import.meta.hot));
}

