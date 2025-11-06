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
  }),

  getters: {  },
  actions: {
    async fetchEmployees() {
        const queryParams = new URLSearchParams();
        if (this.searchName) queryParams.append('search', this.searchName);
        if (this.searchGenderId) queryParams.append('gender_id', this.searchGenderId);
        if (this.searchLocalityId) queryParams.append('locality_id', this.searchLocalityId);
        if (this.searchNationalityId) queryParams.append('nationality_id', this.searchNationalityId);
        if (this.searchCitizenshipStatusId) queryParams.append('citizenship_status_id', this.searchCitizenshipStatusId);
        if (this.sortBy) queryParams.append('sort_by', this.sortBy);
        if (this.sortDirection) queryParams.append('sort_direction', this.sortDirection);
        if (this.perPage) queryParams.append('per_page', this.perPage.toString());
      try {
        const response = await fetch(`${API_URL}/employees?${queryParams.toString()}`);
        const data = await response.json();
        this.employees = data.data;
        console.log(data);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeStore, import.meta.hot));
}
