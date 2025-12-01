import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { useEmployeeStore } from './employee-store';
import type { EmployeeLeave } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface CreateEmployeeLeaveBody {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  notes?: string | null;
  multiplier?: number;
}

interface UpdateEmployeeLeaveBody {
  employeeId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  notes?: string | null;
  multiplier?: number;
}

export const useEmployeeLeaveStore = defineStore('employeeLeave', {
  state: () => ({
    employeeLeaves: [] as EmployeeLeave[],
    isLoading: false,
    isLoadingEmployeeLeaves: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      leaveTypeId: null as number | null,
      startDate: null as string | null,
      endDate: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchEmployeeLeaves(page?: number, perPage?: number) {
      if (this.isLoadingEmployeeLeaves) return;

      this.isLoadingEmployeeLeaves = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const employeeStore = useEmployeeStore();
        const queryParams = new URLSearchParams();
        
        // Get employeeId from selectedEmployee in employee store
        if (employeeStore.selectedEmployee?.id) {
          queryParams.append('employeeId', employeeStore.selectedEmployee.id);
        }
        
        // Add search filters
        if (this.searchFilters.leaveTypeId) {
          queryParams.append('leaveTypeId', this.searchFilters.leaveTypeId.toString());
        }
        if (this.searchFilters.startDate) {
          queryParams.append('startDate', this.searchFilters.startDate);
        }
        if (this.searchFilters.endDate) {
          queryParams.append('endDate', this.searchFilters.endDate);
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 5;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employee-leaves?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employee leaves: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.employeeLeaves = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.employeeLeaves = data;
        } else {
          this.employeeLeaves = [];
        }
      } catch (error) {
        console.error('Error fetching employee leaves:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching employee leaves';
      } finally {
        this.isLoadingEmployeeLeaves = false;
      }
    },

    async createEmployeeLeave(
      employeeId: string,
      leaveTypeId: number,
      startDate: string,
      endDate: string,
      notes?: string | null,
      multiplier?: number
    ): Promise<EmployeeLeave | null> {
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

        const body: CreateEmployeeLeaveBody = {
          employeeId,
          leaveTypeId: leaveTypeId.toString(),
          startDate,
          endDate,
        };

        if (notes !== undefined && notes !== null) {
          body.notes = notes;
        }

        if (multiplier !== undefined) {
          body.multiplier = multiplier;
        }

        const response = await fetch(`${API_URL}/employee-leaves`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create employee leave: ${response.statusText}`);
        }

        const result = await response.json();
        const newEmployeeLeave = result.data || result;

        // Add to employee leaves list
        this.employeeLeaves = [...this.employeeLeaves, newEmployeeLeave];

        return newEmployeeLeave;
      } catch (error) {
        console.error('Error creating employee leave:', error);
        this.error = error instanceof Error ? error.message : 'Error creating employee leave';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateEmployeeLeave(
      id: string,
      employeeId?: string,
      leaveTypeId?: number,
      startDate?: string,
      endDate?: string,
      notes?: string | null,
      multiplier?: number
    ): Promise<EmployeeLeave | null> {
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

        const body: UpdateEmployeeLeaveBody = {};

        if (employeeId !== undefined) {
          body.employeeId = employeeId;
        }
        if (leaveTypeId !== undefined) {
          body.leaveTypeId = leaveTypeId.toString();
        }
        if (startDate !== undefined) {
          body.startDate = startDate;
        }
        if (endDate !== undefined) {
          body.endDate = endDate;
        }
        if (notes !== undefined) {
          body.notes = notes;
        }
        if (multiplier !== undefined) {
          body.multiplier = multiplier;
        }

        const response = await fetch(`${API_URL}/employee-leaves/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to update employee leave: ${response.statusText}`);
        }

        const result = await response.json();
        const updatedEmployeeLeave = result.data || result;

        // Update in employee leaves list
        const index = this.employeeLeaves.findIndex((el) => el.id === id);
        if (index !== -1) {
          this.employeeLeaves[index] = updatedEmployeeLeave;
        }

        return updatedEmployeeLeave;
      } catch (error) {
        console.error('Error updating employee leave:', error);
        this.error = error instanceof Error ? error.message : 'Error updating employee leave';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteEmployeeLeave(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/employee-leaves/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete employee leave: ${response.statusText}`);
        }

        // Remove from employee leaves list
        this.employeeLeaves = this.employeeLeaves.filter((el) => el.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting employee leave:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting employee leave';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeLeaveStore, import.meta.hot));
}

