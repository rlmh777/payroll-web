import { defineStore, acceptHMRUpdate } from 'pinia';
import type { Employee } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api'

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [] as Employee[],
    searchName: '',
    searchGenderId: '',
    searchLocalityId: '',
    searchNationalityId: '',
    searchCitizenshipStatusId: '',
    sortBy: 'lastName',
    sortDirection: 'asc',
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    isLoading: false,
    hasMore: true,
  }),

  getters: {  },
  actions: {
    async fetchEmployees(reset: boolean = true) {
      if (this.isLoading) return;
      
      this.isLoading = true;
      
      if (reset) {
        this.currentPage = 1;
        this.employees = [];
        this.hasMore = true;
      }

      const queryParams = new URLSearchParams();
      if (this.searchName) queryParams.append('search', this.searchName);
      if (this.searchGenderId) queryParams.append('gender_id', this.searchGenderId);
      if (this.searchLocalityId) queryParams.append('locality_id', this.searchLocalityId);
      if (this.searchNationalityId) queryParams.append('nationality_id', this.searchNationalityId);
      if (this.searchCitizenshipStatusId) queryParams.append('citizenship_status_id', this.searchCitizenshipStatusId);
      if (this.sortBy) queryParams.append('sort_by', this.sortBy);
      if (this.sortDirection) queryParams.append('sort_direction', this.sortDirection);
      if (this.perPage) queryParams.append('per_page', this.perPage.toString());
      queryParams.append('page', this.currentPage.toString());

      try {
        const response = await fetch(`${API_URL}/employees?${queryParams.toString()}`);
        const data = await response.json();
        
        if (reset) {
          this.employees = data.data;
        } else {
          this.employees = [...this.employees, ...data.data];
        }
        
        this.currentPage = data.current_page;
        this.lastPage = data.last_page;
        this.total = data.total;
        this.hasMore = data.current_page < data.last_page;
        
        console.log(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      } finally {
        this.isLoading = false;
      }
    },
    
    async loadMoreEmployees() {
      if (!this.hasMore || this.isLoading) {
        return;
      }
      
      // Don't increment here, let fetchEmployees handle it
      const nextPage = this.currentPage + 1;
      this.currentPage = nextPage;
      await this.fetchEmployees(false);
    },
    
    resetEmployees() {
      this.currentPage = 1;
      this.employees = [];
      this.hasMore = true;
      this.isLoading = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeStore, import.meta.hot));
}
