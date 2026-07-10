import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface BankAccountType {
  id: number;
  name: string;
}

export const useBankAccountTypeStore = defineStore('bankAccountType', {
  state: () => ({
    bankAccountTypes: [] as BankAccountType[],
    isLoading: false,
    isLoadingBankAccountTypes: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    bankAccountTypeToEdit: null as BankAccountType | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    async fetchBankAccountTypes(page?: number, perPage?: number) {
      if (this.isLoadingBankAccountTypes) {
        return;
      }

      this.isLoadingBankAccountTypes = true;
      this.error = null;

      try {
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 10;

        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        if (this.search) {
          queryParams.append('search', this.search);
        }

        const response = await fetch(`${API_URL}/bank-account-types?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        this.bankAccountTypes = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading bank account types';
        return null;
      } finally {
        this.isLoadingBankAccountTypes = false;
      }
    },

    async createBankAccountType(name: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/bank-account-types`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Failed to create bank account type.');
        }

        await this.fetchBankAccountTypes();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating bank account type';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateBankAccountType(id: number, payload: Partial<BankAccountType>) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/bank-account-types/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Update failed.');
        }

        await this.fetchBankAccountTypes();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating bank account type';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteBankAccountType(id: number) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/bank-account-types/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to delete bank account type.');
        }

        this.bankAccountTypes = this.bankAccountTypes.filter((item) => item.id !== id);
        this.total = Math.max(0, this.total - 1);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting bank account type';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    extractErrorMessage(errorBody: Record<string, unknown>) {
      const errors = errorBody.errors;
      if (errors && typeof errors === 'object') {
        const firstField = Object.values(errors)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }

      return typeof errorBody.message === 'string' ? errorBody.message : null;
    },

    setBankAccountTypeToEdit(bankAccountType: BankAccountType | null) {
      this.bankAccountTypeToEdit = bankAccountType ? { ...bankAccountType } : null;
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useBankAccountTypeStore, import.meta.hot));
}
