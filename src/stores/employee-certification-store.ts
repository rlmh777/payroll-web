import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeCertification {
  id: string;
  employeeId: string;
  name: string;
  issuingOrganization?: string | null;
  credentialId?: string | null;
  issuedOn?: string | null;
  expiresOn?: string | null;
  notes?: string | null;
}

export const useEmployeeCertificationStore = defineStore('employeeCertification', {
  state: () => ({
    records: [] as EmployeeCertification[],
    isLoading: false,
    recordToEdit: null as EmployeeCertification | null,
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
        const response = await fetch(`${API_URL}/employee-certifications?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load certifications');
        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading certifications';
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: Partial<EmployeeCertification>) {
      const response = await fetch(`${API_URL}/employee-certifications`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Create failed');
      }
    },

    async updateRecord(id: string, payload: Partial<EmployeeCertification>) {
      const response = await fetch(`${API_URL}/employee-certifications/${id}`, {
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
      const response = await fetch(`${API_URL}/employee-certifications/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.records = this.records.filter((record) => record.id !== id);
    },

    setRecordToEdit(record: EmployeeCertification | null) {
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
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeCertificationStore, import.meta.hot));
}
