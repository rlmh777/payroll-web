import { defineStore, acceptHMRUpdate } from 'pinia';
import type { District, Locality } from '@core/types/models';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useLocalityStore = defineStore('locality', {
  state: () => ({
    localities: [] as Locality[],
    districts: [] as District[],
    isLoading: false,
    isLoadingDistricts: false,
    currentPage: 1,
    lastPage: 1,
    search: '',
    total: 0,
    error: null as string | null,
    isCreateOpen: false, // <- new
    localityToEdit: null as Locality | null, // <- new
  }),

  getters: {},

  actions: {
    async fetchLocalities({
      search,
      districtId,
      page,
      perPage,
    }: {
      search?: string;
      districtId?: string;
      page?: number;
      perPage?: number;
    }) {
      if (this.isLoading) return;

      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        // 1. Determine Pagination Parameters
        const currentPage = page ?? this.currentPage;
        // Default page size (e.g., 10) if not provided and state is missing
        const itemsPerPage = perPage ?? 20;
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });
        if (search) {
          queryParams.append('search', search);
        }
        if (districtId) {
          queryParams.append('districtId', districtId);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/localities?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch localities: ${response.statusText}`);
        }

        const data = await response.json();
        this.localities = data.data || data;
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        console.error('Error fetching localities:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching localities';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDistricts(search?: string) {
      if (this.isLoadingDistricts) return;

      this.isLoadingDistricts = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/districts?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch districts: ${response.statusText}`);
        }

        const data = await response.json();
        this.districts = data.data || data;
      } catch (error) {
        console.error('Error fetching districts:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching districts';
      } finally {
        this.isLoadingDistricts = false;
      }
    },

    async createLocality(name: string, districtId: string): Promise<Locality | null> {
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

        const response = await fetch(`${API_URL}/localities`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, districtId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create locality: ${response.statusText}`);
        }

        const result = await response.json();
        const newLocality = result.data || result;

        // Insert the fully loaded record (includes district/country) at the top.
        this.localities = [
          newLocality,
          ...this.localities.filter((locality) => locality.id !== newLocality.id),
        ];
        this.total += 1;

        return newLocality;
      } catch (error) {
        console.error('Error creating locality:', error);
        this.error = error instanceof Error ? error.message : 'Error creating locality';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateLocality(id: string, name: string, districtId: string): Promise<Locality | null> {
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

        const response = await fetch(`${API_URL}/localities/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name, districtId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update locality: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedLocality = result.data || result;

        // Update in localities list
        const index = this.localities.findIndex((l) => l.id === id);
        if (index !== -1) {
          this.localities[index] = updatedLocality;
        }

        return updatedLocality;
      } catch (error) {
        console.error('Error updating locality:', error);
        this.error = error instanceof Error ? error.message : 'Error updating locality';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteLocality(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/localities/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete locality: ${response.statusText}`);
        }

        // Remove from localities list
        this.localities = this.localities.filter((l) => l.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting locality:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting locality';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
    openCreateDailog() {
      this.isCreateOpen = true;
    },
    closeCreateDailog() {
      this.isCreateOpen = false;
    },
    setLocalityToEdit(locality: Locality | null) {
      this.localityToEdit = locality ? { ...locality } : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLocalityStore, import.meta.hot));
}
