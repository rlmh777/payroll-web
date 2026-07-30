import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface Institution {
  id: string;
  name: string;
}

// --- Store Configuration ---

// API base URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useInstitutionStore = defineStore('institution', {
  state: () => ({
    institutions: [] as Institution[],
    isLoading: false,
    isLoadingInstitutions: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    institutionToEdit: null as Institution | null, // <- new
    institutionToAdd: null as Institution | null, // <- new
    isCreateOpen: false, // <- new
  }),

  // --- Actions ---
  actions: {
    /**
     * Fetches  institutions from the backend API using current state parameters (pagination, sort, search).
     */
    async fetchInstitutions(page?: number, perPage?: number) {
      if (this.isLoadingInstitutions) return;
      this.isLoadingInstitutions = true;
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

        const apiUrlWithParams = `${API_URL}/institutions?${queryParams}`;

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
        this.institutions = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading institutions';
        return null;
      } finally {
        this.isLoadingInstitutions = false;
      }
    },
    /**
     * Updates an existing Institution record via API.
     */
    async updateInstitution(id: string, payload: Partial<Institution>) {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();

        const response = await fetch(`${API_URL}/institutions/${id}`, {
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
        await this.fetchInstitutions();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating institution';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    /**
     * Create Institution record via API.
     */
    async createInstitution(name: string): Promise<Institution | null> {
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

        const response = await fetch(`${API_URL}/institutions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to create institutions: ${response.statusText}`,
          );
        }

        const result = await response.json();
        const newInstitution = result.data || result;

        // Add to districts list
        this.institutions = [...this.institutions, newInstitution];
        await this.fetchInstitutions();
        return newInstitution;
      } catch (error) {
        console.error('Error creating institution:', error);
        this.error = error instanceof Error ? error.message : 'Error creating institution';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteInstitution(id: string) {
      // Implementation for deleting an institution via api call
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

        const response = await fetch(`${API_URL}/institutions/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to delete institution: ${response.statusText}`,
          );
        }

        // Remove from institutions list
        this.institutions = this.institutions.filter((inst) => inst.id !== id);
      } catch (error) {
        console.error('Error deleting institution:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting institution';
      } finally {
        this.isLoading = false;
      }
    },

    setInstitutionToEdit(institution: Institution | null) {
      this.institutionToEdit = institution ? { ...institution } : null;
    },
    setInstitutionToAdd(institution: Institution | null) {
      this.institutionToAdd = institution ? { ...institution } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useInstitutionStore, import.meta.hot));
}
