import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface Country {
  id: string;
  name: string;
  code1: string;
  code2: string;
  nationalityName: string;
}

// --- Store Configuration ---

// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useCountryStore = defineStore('country', {
  state: () => ({
    // Data and Pagination
    countries: [] as Country[],
    isLoading: false,
    isLoadingCountries: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    countryToEdit: null as Country | null, // <- new
  }),

  // --- Actions ---
  actions: {
    /**
     * Fetches countries from the backend API using current state parameters (pagination, sort, search).
     */
    async fetchCountries(page?: number, perPage?: number) {
      if (this.isLoadingCountries) return;
      this.isLoadingCountries = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        // 1. Determine Pagination Parameters
        const currentPage = page ?? this.currentPage;
        // Default page size (e.g., 10) if not provided and state is missing
        const itemsPerPage = perPage ?? 10;

        // 2. Construct URL Query Parameters
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        if (this.search) queryParams.append('search', this.search);

        // 3. Setup Headers (including Authorization)
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const apiUrlWithParams = `${API_URL}/countries?${queryParams}`;

        // 4. Perform Fetch Request
        const response = await fetch(apiUrlWithParams, {
          headers,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        // 5. Update State with Response Data
        this.countries = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading countries';
        return null;
      } finally {
        this.isLoadingCountries = false;
      }
    },
    /**
     * Updates an existing country record via API.
     */
    async updateCountry(id: string, payload: Partial<Country>) {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();

        const response = await fetch(`${API_URL}/countries/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Update failed.');
        }

        // Refresh the list after successful update
        await this.fetchCountries();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating country';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    setCountryToEdit(country: Country | null) {
      this.countryToEdit = country ? { ...country } : null;
    },
  },
});

// HMR setup for development
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCountryStore, import.meta.hot));
}
