import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface Relationship {
  id: number;
  name: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useRelationshipStore = defineStore('relationship', {
  state: () => ({
    relationships: [] as Relationship[],
    isLoading: false,
    isLoadingRelationships: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    relationshipToEdit: null as Relationship | null,
    isCreateOpen: false,
  }),

  actions: {
    async fetchRelationships(page?: number, perPage?: number) {
      if (this.isLoadingRelationships) return;
      this.isLoadingRelationships = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 20;

        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        if (this.search) queryParams.append('search', this.search);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/relationships?${queryParams}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        this.relationships = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading relationships';
        return null;
      } finally {
        this.isLoadingRelationships = false;
      }
    },

    async updateRelationship(id: number, payload: Partial<Relationship>) {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const response = await fetch(`${API_URL}/relationships/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const validationMessage = errorBody.errors?.name?.[0];
          throw new Error(validationMessage || errorBody.message || 'Update failed.');
        }

        await this.fetchRelationships();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating relationship';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async createRelationship(name: string): Promise<Relationship | null> {
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

        const response = await fetch(`${API_URL}/relationships`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ name }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const validationMessage = errorBody.errors?.name?.[0];
          throw new Error(validationMessage || errorBody.message || 'Failed to create relationship.');
        }

        const result = await response.json();
        await this.fetchRelationships();
        return result.data || result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating relationship';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteRelationship(id: number) {
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

        const response = await fetch(`${API_URL}/relationships/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to delete relationship.');
        }

        this.relationships = this.relationships.filter((item) => item.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting relationship';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    setRelationshipToEdit(relationship: Relationship | null) {
      this.relationshipToEdit = relationship ? { ...relationship } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useRelationshipStore, import.meta.hot));
}
