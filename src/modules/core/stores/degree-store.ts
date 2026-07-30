import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface Degree {
  id: string;
  name: string;
}

// --- Store Configuration ---

// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useDegreeStore = defineStore('degree', {
  state: () => ({
    degrees: [] as Degree[],
    isLoading: false,
    isLoadingDegrees: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    degreeToEdit: null as Degree | null, // <- new
    degreeToAdd: null as Degree | null, // <- new
    isCreateOpen: false, // <- new
  }),

  // --- Actions ---
  actions: {
    /**
     * Fetches  institutions from the backend API using current state parameters (pagination, sort, search).
     */
    async fetchDegrees(page?: number, perPage?: number) {
      if (this.isLoadingDegrees) return;
      this.isLoadingDegrees = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        // 1. Determine Pagination Parameters
        const currentPage = page ?? this.currentPage;
        // Default page size (e.g., 10) if not provided and state is missing
        const itemsPerPage = perPage ?? 20;

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

        const apiUrlWithParams = `${API_URL}/degrees?${queryParams}`;

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
        this.degrees = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading degrees';
        return null;
      } finally {
        this.isLoadingDegrees = false;
      }
    },
    /**
     * Updates an existing Degrees record via API.
     */
    async updateDegree(id: string, payload: Partial<Degree>) {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();

        const response = await fetch(`${API_URL}/degrees/${id}`, {
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
        await this.fetchDegrees();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating degree';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Create Degree record via API.
     */
    async createDegree(name: string): Promise<Degree | null> {
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

        const response = await fetch(`${API_URL}/degrees`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create degree: ${response.statusText}`);
        }

        const result = await response.json();
        const newDegree = result.data || result;

        // Add to degree list
        this.degrees = [...this.degrees, newDegree];
        await this.fetchDegrees();
        return newDegree;
      } catch (error) {
        console.error('Error creating degree:', error);
        this.error = error instanceof Error ? error.message : 'Error creating degree';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteDegree(id: string) {
      // Implementation for deleting an degree via api call
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

        const response = await fetch(`${API_URL}/degrees/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete degree: ${response.statusText}`);
        }

        // Remove from institutions list
        this.degrees = this.degrees.filter((inst) => inst.id !== id);
      } catch (error) {
        console.error('Error deleting degree:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting degree';
      } finally {
        this.isLoading = false;
      }
    },

    setDegreeToEdit(degree: Degree | null) {
      this.degreeToEdit = degree ? { ...degree } : null;
    },
    setDegreeToAdd(degree: Degree | null) {
      this.degreeToAdd = degree ? { ...degree } : null;
    },
    openCreateDailog() {
      this.isCreateOpen = true;
    },
    closeCreateDailog() {
      this.isCreateOpen = false;
    },
  },
});

// HMR setup for development
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDegreeStore, import.meta.hot));
}
