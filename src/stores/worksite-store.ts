import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Locality } from '../components/models';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface Worksite {
  id: number;
  name: string;
  address1: string;
  address2?: string | null;
  localityId: string;
  locality?: Locality | null;
}

export interface WorksitePayload {
  name: string;
  address1: string;
  address2?: string | null;
  localityId: string;
}

export const useWorksiteStore = defineStore('worksite', {
  state: () => ({
    worksites: [] as Worksite[],
    localityOptions: [] as Locality[],
    isLoading: false,
    isLoadingWorksites: false,
    isLoadingLocalities: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    worksiteToEdit: null as Worksite | null,
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

    async fetchLocalityOptions() {
      if (this.isLoadingLocalities) {
        return;
      }

      this.isLoadingLocalities = true;

      try {
        const queryParams = new URLSearchParams({
          page: '1',
          per_page: '500',
        });

        const response = await fetch(`${API_URL}/localities?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch localities: ${response.statusText}`);
        }

        const data = await response.json();
        this.localityOptions = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading localities';
      } finally {
        this.isLoadingLocalities = false;
      }
    },

    async fetchWorksites(page?: number, perPage?: number) {
      if (this.isLoadingWorksites) {
        return;
      }

      this.isLoadingWorksites = true;
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

        const response = await fetch(`${API_URL}/worksites?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        this.worksites = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading work sites';
        return null;
      } finally {
        this.isLoadingWorksites = false;
      }
    },

    async createWorksite(payload: WorksitePayload): Promise<Worksite | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/worksites`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Failed to create work site.');
        }

        const result = await response.json();
        const created = (result.data ?? result) as Worksite;
        await this.fetchWorksites(1, 100);
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating work site';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateWorksite(id: number, payload: Partial<WorksitePayload>) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/worksites/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Update failed.');
        }

        await this.fetchWorksites();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating work site';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteWorksite(id: number) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/worksites/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.error || errorBody.message || 'Failed to delete work site.');
        }

        this.worksites = this.worksites.filter((item) => item.id !== id);
        this.total = Math.max(0, this.total - 1);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting work site';
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

    setWorksiteToEdit(worksite: Worksite | null) {
      this.worksiteToEdit = worksite ? { ...worksite } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useWorksiteStore, import.meta.hot));
}
