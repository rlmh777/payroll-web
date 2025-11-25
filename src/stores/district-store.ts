import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { Country } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface District {
  id: string;
  name: string;
  countryId?: string;
  country?: {
    id: string;
    name: string;
    code1?: string;
    code2?: string;
    nationalityName?: string;
  };
}

export const useDistrictStore = defineStore('district', {
  state: () => ({
    districts: [] as District[],
    countries: [] as Country[],
    isLoading: false,
    isLoadingCountries: false,
    isLoadingDistricts: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
  }),

  getters: {},

  actions: {
    async fetchDistricts(search?: string, countryId?: string) {
      if (this.isLoadingDistricts) return;

      this.isLoadingDistricts = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
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
      } catch (error) {
        console.error('Error fetching districts:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching districts';
      } finally {
        this.isLoadingDistricts = false;
      }
    },

    async fetchCountries(search?: string) {
      if (this.isLoadingCountries) return;

      this.isLoadingCountries = true;
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
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDistrictStore, import.meta.hot));
}

