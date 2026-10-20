import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { Gender } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type { Gender };

export const useGenderStore = defineStore('gender', {
  state: () => ({
    genders: [] as Gender[],
    isLoading: false,
    isLoadingGenders: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    genderToEdit: null as Gender | null,
    isCreateOpen: false,
  }),

  actions: {
    async fetchGenders(page?: number, perPage?: number) {
      if (this.isLoadingGenders) return;
      this.isLoadingGenders = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 20;
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        if (this.search) {
          queryParams.append('search', this.search);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/genders?${queryParams}`, { headers });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        this.genders = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading genders';
      } finally {
        this.isLoadingGenders = false;
      }
    },

    async createGender(name: string): Promise<Gender | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/genders`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = Array.isArray(errorData.error?.name)
            ? errorData.error.name[0]
            : errorData.error || errorData.message || `Failed to create gender: ${response.statusText}`;
          throw new Error(message);
        }

        const result = await response.json();
        const created = (result.data || result) as Gender;
        await this.fetchGenders(this.currentPage);
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating gender';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateGender(id: string, payload: Partial<Gender>) {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await fetch(`${API_URL}/genders/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const message = Array.isArray(errorBody.error?.name)
            ? errorBody.error.name[0]
            : errorBody.error || errorBody.message || 'Update failed.';
          throw new Error(message);
        }

        await this.fetchGenders(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating gender';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteGender(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/genders/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || errorData.message || `Failed to delete gender: ${response.statusText}`);
        }

        this.genders = this.genders.filter((gender) => gender.id !== id);
        await this.fetchGenders(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting gender';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    setGenderToEdit(gender: Gender | null) {
      this.genderToEdit = gender ? { ...gender } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useGenderStore, import.meta.hot));
}
