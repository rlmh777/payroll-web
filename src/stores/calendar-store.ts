import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface CalendarEntry {
  id: string;
  date: string;
  type: 'holiday' | 'vacation' | 'sick' | 'other' | 'timesheet' | 'schedule';
  description: string;
  rate: string | number;
  calendar_group_id?: string | null;
  calendar_group_name?: string | null;
  calendar_group_color?: string | null;
  source?: 'calendar' | 'timesheet';
}

export interface CalendarEmployee {
  id: string;
  firstName: string;
  lastName: string;
  code?: string;
  employmentDetails?: Array<{
    department?: {
      id: string;
      name: string;
    };
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendars: [] as CalendarEntry[],
    calendarGroups: [] as { id: string; key: string; name: string; color: string }[],
    calendarEmployees: [] as CalendarEmployee[],
    currentEmployee: null as CalendarEmployee | null,
    approvalItems: [] as Array<{
      id: string;
      type: 'timesheet' | 'schedule' | 'leave';
      date: string;
      description: string;
      hours_worked: string | number | null;
      approval_status: string;
      employee_id: string;
    }>,
    isLoading: false,
    isLoadingCalendars: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
  }),

  actions: {
    async fetchCalendars(params?: {
      start?: string;
      end?: string;
      page?: number;
      perPage?: number;
      search?: string;
      groupIds?: string[];
      employeeId?: string;
      employeeIds?: string[];
    }) {
      if (this.isLoadingCalendars) return;
      this.isLoadingCalendars = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const currentPage = params?.page ?? this.currentPage;
        const itemsPerPage = params?.perPage ?? 50;
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        const searchValue = params?.search ?? this.search;
        if (searchValue) queryParams.append('search', searchValue);
        if (params?.start) queryParams.append('start', params.start);
        if (params?.end) queryParams.append('end', params.end);
        if (params?.groupIds?.length) {
          queryParams.append('group_ids', params.groupIds.join(','));
        }
        if (params?.employeeId) {
          queryParams.append('employee_id', params.employeeId);
        }
        if (params?.employeeIds?.length) {
          queryParams.append('employee_ids', params.employeeIds.join(','));
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendar-events?${queryParams}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        const payload = data.data ?? data;
        this.calendars = Array.isArray(payload) ? payload : [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.calendars.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading calendars';
      } finally {
        this.isLoadingCalendars = false;
      }
    },

    async createCalendar(payload: {
      date: string;
      description: string;
      type?: CalendarEntry['type'];
      rate?: number | string;
      calendar_group_id?: string | null;
    }): Promise<CalendarEntry | null> {
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

        const response = await fetch(`${API_URL}/calendars`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create calendar entry: ${response.statusText}`);
        }

        const result = await response.json();
        const newEntry = result.data || result;

        this.calendars = [newEntry, ...this.calendars];
        return newEntry;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating calendar entry';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    async createScheduleTimesheet(payload: {
      employeeId: string;
      date: string;
      startTime: string;
      endTime: string;
    }) {
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

        const response = await fetch(`${API_URL}/schedule-employee-timesheets`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `Failed to create schedule timesheet: ${response.statusText}`,
          );
        }

        return await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating schedule timesheet';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteCalendar(id: string) {
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

        const response = await fetch(`${API_URL}/calendars/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete calendar entry: ${response.statusText}`);
        }

        this.calendars = this.calendars.filter((entry) => entry.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting calendar entry';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchCalendarGroups() {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendar-groups`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.calendarGroups = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading calendar groups';
      }
    },
    async fetchEmployeeByUserId(userId: string) {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employees/by-user/${userId}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.currentEmployee = data ?? null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading employee';
      }
    },
    async fetchSubordinates(employeeId: string) {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employees/${employeeId}/subordinates`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.calendarEmployees = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading employees';
      }
    },
    async fetchCalendarApprovals(params: {
      start: string;
      end: string;
      employeeId?: string;
      employeeIds?: string[];
      departmentId?: string;
      supervisorId?: string;
      leadId?: string;
    }) {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const queryParams = new URLSearchParams({
          start: params.start,
          end: params.end,
        });

        if (params.employeeId) queryParams.append('employee_id', params.employeeId);
        if (params.employeeIds?.length) queryParams.append('employee_ids', params.employeeIds.join(','));
        if (params.departmentId) queryParams.append('department_id', params.departmentId);
        if (params.supervisorId) queryParams.append('supervisor_id', params.supervisorId);
        if (params.leadId) queryParams.append('lead_id', params.leadId);

        const response = await fetch(`${API_URL}/calendar-approvals?${queryParams}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.approvalItems = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading approvals';
      }
    },
    async updateCalendarApproval(payload: {
      id: string;
      type: 'timesheet' | 'schedule' | 'leave';
      status: 'approved' | 'rejected';
    }) {
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendar-approvals/${payload.type}/${payload.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ status: payload.status }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.error ||
              errorBody.message ||
              `Failed to update approval: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();
        this.approvalItems = this.approvalItems.filter(
          (item) => !(item.id === payload.id && item.type === payload.type),
        );
        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating approval';
        throw error;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalendarStore, import.meta.hot));
}
