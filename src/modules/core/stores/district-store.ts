import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { Country, District } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type { District } from '@core/types/models';

export const useDistrictStore = defineStore('district', {
  state: () => ({
    districts: [] as District[],
    countries: [] as Country[],
    isLoading: false,
    isLoadingCountries: false,
    isLoadingDistricts: false,
    currentPage: 1,
    search: '',
    lastPage: 1,
    total: 0,
    error: null as string | null,
    isCreateOpen: false, // <- new
    districtToEdit: null as District | null, // <- new
  }),

  getters: {},

  actions: {
    async fetchDistricts({
      search,
      countryId,
      page,
      perPage,
    }: {
      search?: string;
      countryId?: string;
      page?: number;
      perPage?: number;
    }) {
      if (this.isLoadingDistricts) return;

      this.isLoadingDistricts = true;
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
        if (countryId) {
          queryParams.append('countryId', countryId);
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
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        console.error('Error fetching districts:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching districts';
      } finally {
        this.isLoadingDistricts = false;
      }
    },

    async fetchCountries(search?: string, perPage = 50) {
      if (this.isLoadingCountries) return;

      this.isLoadingCountries = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams({
          per_page: String(perPage),
        });
        if (search) {
          queryParams.append('search', search);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/countries?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch countries: ${response.statusText}`);
        }

        const data = await response.json();
        this.countries = data.data || data;
      } catch (error) {
        console.error('Error fetching countries:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching countries';
      } finally {
        this.isLoadingCountries = false;
      }
    },

    async createDistrict(name: string, countryId: string): Promise<District | null> {
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

        const response = await fetch(`${API_URL}/districts`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name, countryId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create district: ${response.statusText}`);
        }

        const result = await response.json();
        const newDistrict = result.data || result;

        // Add to districts list
        this.districts = [...this.districts, newDistrict];
        await this.fetchDistricts({});
        return newDistrict;
      } catch (error) {
        console.error('Error creating district:', error);
        this.error = error instanceof Error ? error.message : 'Error creating district';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateDistrict(id: string, name: string, countryId: string): Promise<District | null> {
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

        const response = await fetch(`${API_URL}/districts/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ name, countryId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update district: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedDistrict = result.data || result;

        // Update in districts list
        const index = this.districts.findIndex((d) => d.id === id);
        if (index !== -1) {
          this.districts[index] = updatedDistrict;
        }

        return updatedDistrict;
      } catch (error) {
        console.error('Error updating district:', error);
        this.error = error instanceof Error ? error.message : 'Error updating district';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteDistrict(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/districts/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete district: ${response.statusText}`);
        }

        // Remove from districts list
        this.districts = this.districts.filter((d) => d.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting district:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting district';
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
    setDistrictToEdit(district: District | null) {
      this.districtToEdit = district ? { ...district } : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistrictStore, import.meta.hot));
}
