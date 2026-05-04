import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface WorkTimesheet {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days: string[];
  is_active: boolean;
}

export interface WorkTimesheetPayload {
  name: string;
  start_time: string;
  end_time: string;
  days: string[];
}

export const useWorkTimesheetStore = defineStore('workTimesheet', {
  state: () => ({
    workTimesheets: [] as WorkTimesheet[],
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      return headers;
    },
    async fetchWorkTimesheets() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/work-timesheets`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to load work timesheets: ${response.statusText}`);
        }

        const data = await response.json();
        this.workTimesheets = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load work timesheets';
      } finally {
        this.isLoading = false;
      }
    },
    async createWorkTimesheet(payload: WorkTimesheetPayload) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/work-timesheets`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to save work timesheet.');
        }

        const data = await response.json();
        this.workTimesheets = [data, ...this.workTimesheets];
        return data as WorkTimesheet;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save work timesheet';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
    async updateWorkTimesheet(id: string, payload: WorkTimesheetPayload) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/work-timesheets/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to update work timesheet.');
        }

        const data = (await response.json()) as WorkTimesheet;
        const index = this.workTimesheets.findIndex((timesheet) => timesheet.id === id);
        if (index !== -1) {
          this.workTimesheets[index] = data;
        } else {
          this.workTimesheets = [data, ...this.workTimesheets];
        }

        return data;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update work timesheet';
        return null;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkTimesheetStore, import.meta.hot));
}
