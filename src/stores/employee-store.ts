import { defineStore, acceptHMRUpdate } from 'pinia';
import type { CitizenshipStatus, Country, Employee, Gender, Honorific, LeaveType, Locality, PaymentMethod, PayrateFrequency } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api'

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [] as Employee[],
    genders: [] as Gender[],
    localities: [] as Locality[],
    nationalities: [] as Country[],
    citizenshipStatuses: [] as CitizenshipStatus[],
    honorifics: [] as Honorific[],
    leaveTypes: [] as LeaveType[],
    payrateFrequencies: [] as PayrateFrequency[],
    paymentMethods: [] as PaymentMethod[],
    searchName: '',
    sortBy: 'lastName',
    sortDirection: 'asc',
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    isLoading: false,
    isLoadingEmployeeById: false,
    isLoadingGenders: false,
    isLoadingLocalities: false,
    isLoadingNationalities: false,
    isLoadingCitizenshipStatuses: false,
    isLoadingHonorifics: false,
    isLoadingLeaveTypes: false,
    hasMore: true,
    selectedEmployee: null as Employee | null,
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
    
    async fetchEmployeeById(id: string) {
      if (this.isLoadingEmployeeById) return;
      
      this.isLoadingEmployeeById = true;
      try {
        const response = await fetch(`${API_URL}/employees/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch employee');
        }
        const data = await response.json();
        this.selectedEmployee = data;
        return data;
      } catch (error) {
        console.error('Error fetching employee:', error);
        throw error;
      } finally {
        this.isLoadingEmployeeById = false;
      }
    },

    async fetchGenders() {
      if (this.isLoadingGenders) return;
      
      this.isLoadingGenders = true;
      try {
        const response = await fetch(`${API_URL}/genders`);
        const data = await response.json();
        this.genders = data.data;
      } catch (error) {
        console.error('Error fetching genders:', error);
      } finally {
        this.isLoadingGenders = false;
      }
    },

    async fetchLocalities(search?: string) {
      if (this.isLoadingLocalities) return;
      
      this.isLoadingLocalities = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/localities?${queryParams.toString()}`);
        const data = await response.json();
        this.localities = data.data;
      } catch (error) {
        console.error('Error fetching localities:', error);
      } finally {
        this.isLoadingLocalities = false;
      }
    },

    async fetchNationalities(search?: string) {
      if (this.isLoadingNationalities) return;
      
      this.isLoadingNationalities = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/countries?${queryParams.toString()}`);
        const data = await response.json();
        this.nationalities = data.data;
      } catch (error) {
        console.error('Error fetching nationalities:', error);
      } finally {
        this.isLoadingNationalities = false;
      }
    },

    async fetchCitizenshipStatuses() {
      if (this.isLoadingCitizenshipStatuses) return;
      
      this.isLoadingCitizenshipStatuses = true;
      try {
        const response = await fetch(`${API_URL}/citizenship-statuses`);
        const data = await response.json();
        this.citizenshipStatuses = data.data;
      } catch (error) {
        console.error('Error fetching citizenship statuses:', error);
      } finally {
        this.isLoadingCitizenshipStatuses = false;
      }
    },

    async fetchHonorifics(search?: string) {
      if (this.isLoadingHonorifics) return;
      
      this.isLoadingHonorifics = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/honorifics?${queryParams.toString()}`);
        const data = await response.json();
        this.honorifics = data.data;
      } catch (error) {
        console.error('Error fetching honorifics:', error);
      } finally {
        this.isLoadingHonorifics = false;
      }
    },

    async fetchLeaveTypes(search?: string) {
      if (this.isLoadingLeaveTypes) return;
      
      this.isLoadingLeaveTypes = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/leave-types?${queryParams.toString()}`);
        const data = await response.json();
        this.leaveTypes = data.data;
      } catch (error) {
        console.error('Error fetching leave types:', error);
      } finally {
        this.isLoadingLeaveTypes = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeStore, import.meta.hot));
}
