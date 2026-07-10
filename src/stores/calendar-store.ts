import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { normalizeCalendarEmployee } from 'src/utils/calendar-employment-utils';
import { scheduledWorkRecordToEvents, normalizeCalendarTimeInput, scheduledWorkIdFromEvent } from 'src/utils/calendar-event-utils';

export interface CalendarEntry {
  id: string;
  date: string;
  type: 'work' | 'birthday' | 'holiday' | 'vacation' | 'sick' | 'other';
  description: string;
  rate: string | number;
  calendar_group_id?: string | null;
  calendar_group_name?: string | null;
  calendar_group_color?: string | null;
  source?: 'scheduled_work' | 'leave' | 'birthday' | 'holiday';
  leave_id?: string | null;
  scheduled_work_id?: string | null;
  public_holiday_id?: string | null;
  pay_multiplier?: string | number | null;
  employee_id?: string | null;
  employee_name?: string | null;
  leave_type_id?: string | number | null;
  leave_type_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  department_id?: number | null;
  department_name?: string | null;
  worksite_id?: number | null;
  worksite_name?: string | null;
  include_lunch_hour?: boolean | null;
  lunch_hour_hours?: number | null;
  calendar_id?: string | null;
  approval_status?: string | null;
  notes?: string | null;
  employment_detail_id?: string | null;
  employment_contract_label?: string | null;
  employee_compensation_id?: string | null;
  compensation_label?: string | null;
}

export interface CalendarEmployee {
  id: string;
  firstName: string;
  lastName: string;
  code?: string;
  employmentDetails?: Array<{
    id?: string;
    isActive?: boolean;
    startDate?: string;
    endDate?: string | null;
    departmentId?: number | null;
    worksiteId?: number | null;
    jobTitle?: string | null;
    contractType?: { id: number | string; name: string } | null;
    defaultPayPeriodGroup?: { id: string; name: string } | null;
    department?: {
      id: number | string;
      name: string;
    } | null;
    worksite?: {
      id: number;
      name: string;
    } | null;
  }>;
  employeeCompensations?: Array<{
    id?: string;
    employmentDetailId?: string | null;
    isActive?: boolean;
    effectiveDate?: string;
    endDate?: string | null;
    compensationMethod?: string | null;
    requiresClocking?: boolean | null;
    hourlyRate?: string | number | null;
    yearlyRate?: string | number | null;
  }>;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendars: [] as CalendarEntry[],
    calendarGroups: [] as { id: string; key: string; name: string; color: string }[],
    currentEmployee: null as CalendarEmployee | null,
    approvalItems: [] as Array<{
      id: string;
      type: 'leave';
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
    replaceScheduledWorkEvents(scheduledWorkId: string, events: CalendarEntry[]): void {
      this.calendars = [
        ...events,
        ...this.calendars.filter((entry) => {
          const entryScheduledWorkId = entry.scheduled_work_id ?? scheduledWorkIdFromEvent(entry);
          return entryScheduledWorkId !== scheduledWorkId;
        }),
      ];
    },

    formatApiError(body: Record<string, unknown>, fallback: string): string {
      if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
      }

      if (typeof body.error === 'string' && body.error.trim() !== '') {
        return body.error;
      }

      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const messages = Object.values(errors as Record<string, string[]>)
          .flat()
          .filter((message): message is string => typeof message === 'string' && message.trim() !== '');

        if (messages.length) {
          return messages.join(' ');
        }
      }

      return fallback;
    },

    normalizeScheduledWorkPayload<T extends {
      startTime?: string;
      endTime?: string;
    }>(payload: T): T {
      return {
        ...payload,
        ...(payload.startTime !== undefined
          ? { startTime: normalizeCalendarTimeInput(payload.startTime) }
          : {}),
        ...(payload.endTime !== undefined
          ? { endTime: normalizeCalendarTimeInput(payload.endTime) }
          : {}),
      };
    },

    async fetchCalendars(params?: {
      start?: string;
      end?: string;
      page?: number;
      perPage?: number;
      search?: string;
      groupIds?: string[];
      employeeId?: string;
      employeeIds?: string[];
      departmentId?: number;
      scheduler?: boolean;
    }) {
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
        if (params?.scheduler) {
          queryParams.append('scheduler', '1');
        }
        if (params?.departmentId != null) {
          queryParams.append('department_id', String(params.departmentId));
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/scheduler-events?${queryParams}`, { headers });

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
      startDate: string;
      endDate: string;
      startTime?: string;
      endTime?: string;
      employeeId?: string | null;
      employmentDetailId?: string | null;
      departmentId?: number | null;
      worksiteId?: number | null;
      includeLunchHour?: boolean;
      lunchHourHours?: number;
      description: string;
      type?: CalendarEntry['type'];
      rate?: number | string;
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

        const response = await fetch(`${API_URL}/scheduled-work`, {
          method: 'POST',
          headers,
          body: JSON.stringify(this.normalizeScheduledWorkPayload(payload)),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            this.formatApiError(errorData, `Failed to create calendar entry: ${response.statusText}`),
          );
        }

        const result = await response.json();
        const newEntry = result.data || result;

        const schedulerEvents = scheduledWorkRecordToEvents(newEntry);
        if (schedulerEvents.length) {
          const scheduledWorkId = schedulerEvents[0]?.scheduled_work_id;
          if (scheduledWorkId) {
            this.replaceScheduledWorkEvents(scheduledWorkId, schedulerEvents);
          }
        }

        return newEntry;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating calendar entry';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateCalendar(
      id: string,
      payload: {
        startDate?: string;
        endDate?: string;
        startTime?: string;
        endTime?: string;
        employeeId?: string | null;
        employmentDetailId?: string | null;
        departmentId?: number | null;
        worksiteId?: number | null;
        includeLunchHour?: boolean;
        lunchHourHours?: number;
        description?: string;
        type?: CalendarEntry['type'];
        rate?: number | string;
      },
    ): Promise<CalendarEntry | null> {
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

        const response = await fetch(`${API_URL}/scheduled-work/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(this.normalizeScheduledWorkPayload(payload)),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            this.formatApiError(errorData, `Failed to update calendar entry: ${response.statusText}`),
          );
        }

        const result = await response.json();
        const updatedEntry = result.data || result;

        const schedulerEvents = scheduledWorkRecordToEvents(updatedEntry);
        if (schedulerEvents.length) {
          const scheduledWorkId = schedulerEvents[0]?.scheduled_work_id ?? id;
          this.replaceScheduledWorkEvents(scheduledWorkId, schedulerEvents);
        }

        return updatedEntry;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating calendar entry';
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

        const response = await fetch(`${API_URL}/scheduled-work/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete calendar entry: ${response.statusText}`);
        }

        this.replaceScheduledWorkEvents(id, []);
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

        if (response.status === 404) {
          this.currentEmployee = null;
          return;
        }

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.currentEmployee = data ? normalizeCalendarEmployee(data) : null;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading employee';
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

        const response = await fetch(`${API_URL}/scheduler-approvals?${queryParams}`, { headers });

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
      type: 'leave';
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

        const response = await fetch(`${API_URL}/scheduler-approvals/${payload.type}/${payload.id}`, {
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
