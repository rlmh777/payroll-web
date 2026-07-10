import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface ContractType {
  id: number;
  name: string;
}

export const useContractTypeStore = defineStore('contractType', {
  state: () => ({
    contractTypes: [] as ContractType[],
    isLoading: false,
    isLoadingContractTypes: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchContractTypes(search?: string) {
      if (this.isLoadingContractTypes) return;

      this.isLoadingContractTypes = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ all: '1' });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/contract-types?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to fetch contract types');

        const data = await response.json();
        this.contractTypes = Array.isArray(data) ? data : (data.data ?? []);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error fetching contract types';
      } finally {
        this.isLoadingContractTypes = false;
      }
    },

    async createContractType(name: string): Promise<ContractType | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/contract-types`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Create failed');
        }

        const result = await response.json();
        const created = (result.data ?? result) as ContractType;
        this.contractTypes = [...this.contractTypes, created].sort((a, b) => a.name.localeCompare(b.name));
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating contract type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateContractType(id: number, name: string): Promise<ContractType | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/contract-types/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Update failed');
        }

        const result = await response.json();
        const updated = (result.data ?? result) as ContractType;
        const index = this.contractTypes.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.contractTypes[index] = updated;
          this.contractTypes.sort((a, b) => a.name.localeCompare(b.name));
        }
        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating contract type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useContractTypeStore, import.meta.hot));
}
