import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface SsBenefitType {
  id: number;
  name: string;
}

export const useSsBenefitTypeStore = defineStore('ssBenefitType', {
  state: () => ({
    benefitTypes: [] as SsBenefitType[],
    isLoading: false,
    isLoadingBenefitTypes: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchBenefitTypes(search?: string) {
      if (this.isLoadingBenefitTypes) return;

      this.isLoadingBenefitTypes = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ all: '1' });
        if (search) params.append('search', search);

        const response = await fetch(`${API_URL}/ss-benefit-types?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) throw new Error('Failed to fetch benefit types');

        const data = await response.json();
        this.benefitTypes = Array.isArray(data) ? data : (data.data ?? []);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error fetching benefit types';
      } finally {
        this.isLoadingBenefitTypes = false;
      }
    },

    async createBenefitType(name: string): Promise<SsBenefitType | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/ss-benefit-types`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Create failed');
        }

        const result = await response.json();
        const created = (result.data ?? result) as SsBenefitType;
        this.benefitTypes = [...this.benefitTypes, created].sort((a, b) => a.name.localeCompare(b.name));
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating benefit type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateBenefitType(id: number, name: string): Promise<SsBenefitType | null> {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/ss-benefit-types/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name: name.trim() }),
        });

        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.errors?.name?.[0] || body.message || 'Update failed');
        }

        const result = await response.json();
        const updated = (result.data ?? result) as SsBenefitType;
        const index = this.benefitTypes.findIndex((item) => item.id === id);
        if (index !== -1) {
          this.benefitTypes[index] = updated;
          this.benefitTypes.sort((a, b) => a.name.localeCompare(b.name));
        }
        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating benefit type';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSsBenefitTypeStore, import.meta.hot));
}
