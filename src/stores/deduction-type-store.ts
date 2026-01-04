import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { DeductionType } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useDeductionTypeStore = defineStore('deductionType', {
  state: () => ({
    deductionTypes: [] as DeductionType[],
    isLoading: false,
    isLoadingDeductionTypes: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
  }),

  getters: {},

  actions: {
    async fetchDeductionTypes(page?: number, perPage?: number, search?: string) {
      if (this.isLoadingDeductionTypes) return;

      this.isLoadingDeductionTypes = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
        
        if (search) {
          queryParams.append('search', search);
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 100; // Get more for select dropdowns
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/deduction-types?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch deduction types: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.deductionTypes = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.deductionTypes = data;
        } else {
          this.deductionTypes = [];
        }
      } catch (error) {
        console.error('Error fetching deduction types:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching deduction types';
      } finally {
        this.isLoadingDeductionTypes = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDeductionTypeStore, import.meta.hot));
}

