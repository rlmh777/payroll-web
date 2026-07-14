import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Gender } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api'

export const useGenderStore = defineStore('gender', {
  state: () => ({
    genders: [] as Gender[],
    isLoading: false,
    currentPage: 1,
    lastPage: 1,
    total: 0
  }),

  getters: {  },
  actions: {
    async fetchGenders() {
      if (this.isLoading) return;
      
      this.isLoading = true;

      const queryParams = new URLSearchParams();
      queryParams.append('page', this.currentPage.toString());

      try {
        const response = await fetch(`${API_URL}/genders?${queryParams.toString()}`);
        const data = await response.json();
        
        this.genders = data.data;
      } catch (error) {
        console.error('Error fetching gender:', error);
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useGenderStore, import.meta.hot));
}
