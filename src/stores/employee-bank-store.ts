import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { EmployeeBank } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  message?: string;
}

function extractErrorMessage(errorData: ApiErrorData, fallback: string): string {
  if (errorData.message) {
    return errorData.message;
  }

  if (errorData.errors) {
    const errorKeys = Object.keys(errorData.errors);
    if (errorKeys.length > 0 && errorKeys[0]) {
      const firstError = errorData.errors[errorKeys[0]];
      if (Array.isArray(firstError) && firstError[0]) {
        return firstError[0];
      }
      if (typeof firstError === 'string') {
        return firstError;
      }
    }
  }

  return errorData.error || fallback;
}

export const useEmployeeBankStore = defineStore('employeeBank', {
  state: () => ({
    records: [] as EmployeeBank[],
    isLoading: false,
    recordToEdit: null as EmployeeBank | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          employeeId,
          per_page: '50',
          sort_by: 'isPrimary',
          sort_direction: 'desc',
        });
        const response = await fetch(`${API_URL}/employee-banks?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to load employee bank accounts');
        }

        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading bank accounts';
        this.records = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: {
      employeeId: string;
      bankId: string;
      accountNumber: string;
      isPrimary?: boolean;
      notes?: string | null;
    }) {
      const response = await fetch(`${API_URL}/employee-banks`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: ApiErrorData = await response.json().catch(() => ({}));
        throw new Error(extractErrorMessage(body, 'Create failed'));
      }

      const result = await response.json();
      const created = (result.data ?? result) as EmployeeBank;
      this.records = [...this.records, created];
      return created;
    },

    async updateRecord(
      id: string,
      payload: Partial<{
        bankId: string;
        accountNumber: string;
        isPrimary: boolean;
        notes: string | null;
      }>,
    ) {
      const response = await fetch(`${API_URL}/employee-banks/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body: ApiErrorData = await response.json().catch(() => ({}));
        throw new Error(extractErrorMessage(body, 'Update failed'));
      }

      const result = await response.json();
      const updated = (result.data ?? result) as EmployeeBank;
      const index = this.records.findIndex((record) => record.id === id);
      if (index !== -1) {
        this.records[index] = updated;
      }

      if (updated.isPrimary) {
        this.records = this.records.map((record) => ({
          ...record,
          isPrimary: record.id === updated.id,
        }));
      }

      return updated;
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-banks/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        const body: ApiErrorData = await response.json().catch(() => ({}));
        throw new Error(extractErrorMessage(body, 'Delete failed'));
      }

      this.records = this.records.filter((record) => record.id !== id);
    },

    setRecordToEdit(record: EmployeeBank | null) {
      this.recordToEdit = record ? { ...record } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeBankStore, import.meta.hot));
}
