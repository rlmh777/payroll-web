import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmploymentStatus {
  id: number;
  name: string;
}

export const useEmploymentStatusStore = defineStore('employmentStatus', {
  state: () => ({
    employmentStatuses: [] as EmploymentStatus[],
    isLoading: false,
    isLoadingEmploymentStatuses: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchEmploymentStatuses(search?: string) {
      if (this.isLoadingEmploymentStatuses) return;

      this.isLoadingEmploymentStatuses = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ all: '1' });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/employment-statuses?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to fetch employment statuses');

        const data = await response.json();
        this.employmentStatuses = Array.isArray(data) ? data : (data.data ?? []);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error fetching employment statuses';
      } finally {
        this.isLoadingEmploymentStatuses = false;
      }
    },

    async createEmploymentStatus(name: string): Promise<EmploymentStatus | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/employment-statuses`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Create failed');
        }

        const result = await response.json();
        const created = (result.data ?? result) as EmploymentStatus;
        this.employmentStatuses = [...this.employmentStatuses, created].sort((a, b) => a.name.localeCompare(b.name));
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating employment status';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateEmploymentStatus(id: number, name: string): Promise<EmploymentStatus | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/employment-statuses/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Update failed');
        }

        const result = await response.json();
        const updated = (result.data ?? result) as EmploymentStatus;
        const index = this.employmentStatuses.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.employmentStatuses[index] = updated;
          this.employmentStatuses.sort((a, b) => a.name.localeCompare(b.name));
        }
        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating employment status';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmploymentStatusStore, import.meta.hot));
}
