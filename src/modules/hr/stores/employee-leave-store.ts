import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import { useEmployeeStore } from './employee-store';
import type { EmployeeLeave } from '@core/types/models';

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

export interface TeamLeaveRow {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode?: string | null;
  dateRange: string;
  startDate?: string | null;
  endDate?: string | null;
  leaveTypeId: number | string;
  leaveType?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  worksiteId?: number | null;
  worksiteName?: string | null;
  netLeaveBalance: number | null;
  requestedDays: number;
  statusCode?: string | null;
  statusName?: string | null;
  notes?: string | null;
  statusNote?: string | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl?: string | null;
  }>;
  canApprove: boolean;
  canReject: boolean;
  canCancel: boolean;
  duration?: string | null;
  approvalDate?: string | null;
}

export interface TeamLeaveAccess {
  canAccess: boolean;
  isLeaveAdmin: boolean;
  subordinateCount: number;
}

export interface TeamLeaveFilters {
  fromDate: string | null;
  toDate: string | null;
  employeeId: string | null;
  departmentId: number | null;
  worksiteId: number | null;
  leaveTypeId: number | null;
  statusCode: string | null;
}

const defaultTeamFilters = (): TeamLeaveFilters => ({
  fromDate: null,
  toDate: null,
  employeeId: null,
  departmentId: null,
  worksiteId: null,
  leaveTypeId: null,
  statusCode: null,
});

export const useEmployeeLeaveStore = defineStore('employeeLeave', {
  state: () => ({
    employeeLeaves: [] as EmployeeLeave[],
    teamLeaves: [] as TeamLeaveRow[],
    teamAccess: null as TeamLeaveAccess | null,
    isLoading: false,
    isLoadingEmployeeLeaves: false,
    isLoadingTeamLeaves: false,
    isExportingTeamLeaves: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    teamCurrentPage: 1,
    teamLastPage: 1,
    teamTotal: 0,
    error: null as string | null,
    searchFilters: defaultSearchFilters(),
    teamFilters: defaultTeamFilters(),
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

    resetTeamFilters() {
      this.teamFilters = defaultTeamFilters();
    },

    buildTeamQueryParams(page?: number, perPage = 15, exportAll = false): URLSearchParams {
      const queryParams = new URLSearchParams();
      if (exportAll) {
        queryParams.append('export', '1');
      } else {
        queryParams.append('page', String(page ?? this.teamCurrentPage));
        queryParams.append('per_page', String(perPage));
      }

      const filters = this.teamFilters;
      if (filters.fromDate) queryParams.append('fromDate', filters.fromDate);
      if (filters.toDate) queryParams.append('toDate', filters.toDate);
      if (filters.employeeId) queryParams.append('employeeId', filters.employeeId);
      if (filters.departmentId != null) queryParams.append('departmentId', String(filters.departmentId));
      if (filters.worksiteId != null) queryParams.append('worksiteId', String(filters.worksiteId));
      if (filters.leaveTypeId != null) queryParams.append('leaveTypeId', String(filters.leaveTypeId));
      if (filters.statusCode) queryParams.append('statusCode', filters.statusCode);

      return queryParams;
    },

    async fetchTeamAccess(): Promise<TeamLeaveAccess | null> {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;

        const response = await fetch(`${API_URL}/employee-leaves/team-access`, { headers });
        if (!response.ok) {
          throw new Error('Failed to resolve leave list access');
        }

        const data = (await response.json()) as TeamLeaveAccess;
        this.teamAccess = data;
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to resolve leave list access';
        this.teamAccess = { canAccess: false, isLeaveAdmin: false, subordinateCount: 0 };
        return this.teamAccess;
      }
    },

    async fetchTeamLeaves(page?: number, perPage = 15): Promise<void> {
      const fetchId = ++employeeLeavesFetchId;
      this.isLoadingTeamLeaves = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = this.buildTeamQueryParams(page, perPage, false);
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;

        const response = await fetch(`${API_URL}/employee-leaves/team?${queryParams.toString()}`, {
          headers,
        });

        if (response.status === 403) {
          this.teamLeaves = [];
          this.teamTotal = 0;
          this.teamCurrentPage = 1;
          this.teamLastPage = 1;
          this.teamAccess = {
            canAccess: false,
            isLeaveAdmin: this.teamAccess?.isLeaveAdmin ?? false,
            subordinateCount: this.teamAccess?.subordinateCount ?? 0,
          };
          return;
        }

        if (!response.ok) {
          throw new Error(`Failed to fetch team leaves: ${response.statusText}`);
        }

        const data = await response.json();
        if (fetchId !== employeeLeavesFetchId) {
          return;
        }

        this.teamLeaves = Array.isArray(data.data) ? data.data : [];
        this.teamCurrentPage = data.current_page || 1;
        this.teamLastPage = data.last_page || 1;
        this.teamTotal = data.total || 0;
      } catch (error) {
        if (fetchId !== employeeLeavesFetchId) {
          return;
        }
        this.error = error instanceof Error ? error.message : 'Failed to fetch team leaves';
        this.teamLeaves = [];
      } finally {
        if (fetchId === employeeLeavesFetchId) {
          this.isLoadingTeamLeaves = false;
        }
      }
    },

    async fetchTeamLeavesForExport(): Promise<TeamLeaveRow[]> {
      this.isExportingTeamLeaves = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = this.buildTeamQueryParams(1, 15, true);
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;

        const response = await fetch(`${API_URL}/employee-leaves/team?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to export team leaves: ${response.statusText}`);
        }

        const data = await response.json();
        return Array.isArray(data.data) ? data.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to export team leaves';
        return [];
      } finally {
        this.isExportingTeamLeaves = false;
      }
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
      multiplier?: number,
      attachments: File[] = [],
    ): Promise<EmployeeLeave | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
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

        const hasAttachments = attachments.length > 0;
        let requestBody: BodyInit;
        const headers: HeadersInit = {};

        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        if (hasAttachments) {
          const formData = new FormData();
          Object.entries(body).forEach(([key, value]) => {
            if (value === undefined || value === null) {
              return;
            }
            formData.append(key, String(value));
          });
          attachments.forEach((file) => {
            formData.append('attachments[]', file);
          });
          requestBody = formData;
        } else {
          headers['Content-Type'] = 'application/json';
          requestBody = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}/employee-leaves`, {
          method: 'POST',
          headers,
          body: requestBody,
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create employee leave: ${response.statusText}`;
          if (errorData.errors) {
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
        const newEmployeeLeave = Array.isArray(result)
          ? result[0]
          : (result.data || result);

        if (Array.isArray(result)) {
          this.employeeLeaves = [...this.employeeLeaves, ...result];
        } else {
          this.employeeLeaves = [...this.employeeLeaves, newEmployeeLeave];
        }

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

