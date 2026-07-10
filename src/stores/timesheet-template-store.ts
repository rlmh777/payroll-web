import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import type { TimesheetTemplateDaySchedule } from 'src/utils/timesheet-template-utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface TimesheetTemplate {
  id: string;
  name: string;
  start_time: string;
  end_time: string;
  days: string[];
  day_schedules?: TimesheetTemplateDaySchedule[];
  is_active?: boolean;
}

export interface TimesheetTemplatePayload {
  name: string;
  day_schedules: TimesheetTemplateDaySchedule[];
  is_active?: boolean;
}

export const useTimesheetTemplateStore = defineStore('timesheet-template', {
  state: () => ({
    timesheetTemplates: [] as TimesheetTemplate[],
    isLoading: false,
    isSaving: false,
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

    async fetchTimesheetTemplates() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheet-templates`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to load timesheet templates.');
        }

        this.timesheetTemplates = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load timesheet templates.';
        console.error('Error fetching timesheet templates:', error);
      } finally {
        this.isLoading = false;
      }
    },

    async createTimesheetTemplate(payload: TimesheetTemplatePayload): Promise<TimesheetTemplate | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheet-templates`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? 'Failed to create timesheet template.');
        }

        const created: TimesheetTemplate = await response.json();
        const existingIndex = this.timesheetTemplates.findIndex((item) => item.id === created.id);

        if (existingIndex >= 0) {
          this.timesheetTemplates[existingIndex] = created;
        } else {
          this.timesheetTemplates.push(created);
        }

        this.timesheetTemplates.sort((left, right) => left.name.localeCompare(right.name));
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create timesheet template.';
        console.error('Error creating timesheet template:', error);
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async updateTimesheetTemplate(
      id: string,
      payload: TimesheetTemplatePayload,
    ): Promise<TimesheetTemplate | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheet-templates/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => null);
          throw new Error(data?.message ?? 'Failed to update timesheet template.');
        }

        const updated: TimesheetTemplate = await response.json();
        const existingIndex = this.timesheetTemplates.findIndex((item) => item.id === updated.id);

        if (existingIndex >= 0) {
          this.timesheetTemplates[existingIndex] = updated;
        } else {
          this.timesheetTemplates.push(updated);
        }

        this.timesheetTemplates.sort((left, right) => left.name.localeCompare(right.name));
        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update timesheet template.';
        console.error('Error updating timesheet template:', error);
        return null;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTimesheetTemplateStore, import.meta.hot));
}
