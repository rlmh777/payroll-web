import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { useEmployeeStore } from './employee-store';
import type { EmployeeLeave } from '../components/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

let employeeLeavesFetchId = 0;

const defaultSearchFilters = () => ({
  leaveTypeId: null as number | null,
  startDate: null as string | null,
  endDate: null as string | null,
});

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateEmployeeLeaveBody {
  employeeId: string;
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  fromTime?: string | null;
  toTime?: string | null;
  duration?: string;
  totalDays?: number;
  notes?: string | null;
  multiplier?: number;
}

interface UpdateEmployeeLeaveBody {
  employeeId?: string;
  leaveTypeId?: string;
  startDate?: string;
  endDate?: string;
  fromTime?: string | null;
  toTime?: string | null;
  duration?: string;
  totalDays?: number;
  notes?: string | null;
  multiplier?: number;
  departmentId?: number | null;
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
    searchFilters: defaultSearchFilters(),
  }),

  getters: {
    hasActiveSearchFilters(state): boolean {
      return !!(
        state.searchFilters.leaveTypeId ||
        state.searchFilters.startDate ||
        state.searchFilters.endDate
      );
    },
  },

  actions: {
    resetSearchFilters() {
      this.searchFilters = defaultSearchFilters();
    },

    async fetchEmployeeLeaves(page?: number, perPage?: number) {
      const fetchId = ++employeeLeavesFetchId;
      const employeeStore = useEmployeeStore();
      const employeeId = employeeStore.selectedEmployee?.id;

      if (!employeeId) {
        this.employeeLeaves = [];
        this.total = 0;
        this.currentPage = 1;
        this.lastPage = 1;
        return;
      }

      this.isLoadingEmployeeLeaves = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
        queryParams.append('employeeId', employeeId);
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

        if (fetchId !== employeeLeavesFetchId) {
          return;
        }
        
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
        if (fetchId !== employeeLeavesFetchId) {
          return;
        }
        console.error('Error fetching employee leaves:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching employee leaves';
      } finally {
        if (fetchId === employeeLeavesFetchId) {
          this.isLoadingEmployeeLeaves = false;
        }
      }
    },

    async fetchEmployeeLeaveById(id: string): Promise<EmployeeLeave | null> {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employee-leaves/${id}`, { headers });

        if (!response.ok) {
          throw new Error(`Failed to fetch employee leave: ${response.statusText}`);
        }

        const result = await response.json();
        return result.data || result;
      } catch (error) {
        console.error('Error fetching employee leave:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching employee leave';
        return null;
      }
    },

    async createEmployeeLeave(
      employeeId: string,
      leaveTypeId: number,
      startDate: string,
      endDate: string,
      fromTime?: string | null,
      toTime?: string | null,
      duration?: string,
      totalDays?: number,
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

        if (fromTime !== undefined) {
          body.fromTime = fromTime;
        }
        if (toTime !== undefined) {
          body.toTime = toTime;
        }
        if (duration !== undefined) {
          body.duration = duration;
        }
        if (totalDays !== undefined) {
          body.totalDays = totalDays;
        }
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
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create employee leave: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
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
      fromTime?: string | null,
      toTime?: string | null,
      duration?: string,
      totalDays?: number,
      notes?: string | null,
      multiplier?: number,
      departmentId?: number | null
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
        if (fromTime !== undefined) {
          body.fromTime = fromTime;
        }
        if (toTime !== undefined) {
          body.toTime = toTime;
        }
        if (duration !== undefined) {
          body.duration = duration;
        }
        if (totalDays !== undefined) {
          body.totalDays = totalDays;
        }
        if (notes !== undefined) {
          body.notes = notes;
        }
        if (multiplier !== undefined) {
          body.multiplier = multiplier;
        }
        if (departmentId !== undefined) {
          body.departmentId = departmentId;
        }

        const response = await fetch(`${API_URL}/employee-leaves/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update employee leave: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
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

    async updateLeaveStatus(
      id: string,
      action: 'approve' | 'reject' | 'cancel' | 'submit_for_approval',
      note?: string | null,
    ): Promise<EmployeeLeave | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;

        const response = await fetch(`${API_URL}/employee-leaves/${id}/status`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ action, note: note ?? null }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({})) as ApiErrorData;
          throw new Error(this.extractErrorMessage(errorData) || 'Status update failed');
        }

        const updatedEmployeeLeave = await response.json() as EmployeeLeave;
        const index = this.employeeLeaves.findIndex((el) => el.id === id);
        if (index !== -1) this.employeeLeaves[index] = updatedEmployeeLeave;
        return updatedEmployeeLeave;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Status update failed';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    extractErrorMessage(body: ApiErrorData): string | null {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0];
        if (Array.isArray(first) && first[0]) return String(first[0]);
      }
      return typeof body.message === 'string'
        ? body.message
        : (typeof body.error === 'string' ? body.error : null);
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

