import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeContactRecord {
  id: string;
  employeeId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  phoneNumber1: string;
  phoneNumber2?: string | null;
  email: string;
  address1: string;
  address2?: string | null;
  localityId: string;
  relationshipId: number;
  isDependent: boolean;
  isProfessionalReference: boolean;
  relationship?: { id: number; name: string } | null;
  locality?: { id: string; name?: string } | null;
}

export const useEmployeeContactStore = defineStore('employeeContact', {
  state: () => ({
    records: [] as EmployeeContactRecord[],
    isLoading: false,
    recordToEdit: null as EmployeeContactRecord | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ employeeId, per_page: '50' });
        const response = await fetch(`${API_URL}/employee-contacts?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load contacts');
        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading contacts';
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: Partial<EmployeeContactRecord>) {
      const response = await fetch(`${API_URL}/employee-contacts`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Create failed');
      }
    },

    async updateRecord(id: string, payload: Partial<EmployeeContactRecord>) {
      const response = await fetch(`${API_URL}/employee-contacts/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Update failed');
      }
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-contacts/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.records = this.records.filter((record) => record.id !== id);
    },

    setRecordToEdit(record: EmployeeContactRecord | null) {
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
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeContactStore, import.meta.hot));
}
