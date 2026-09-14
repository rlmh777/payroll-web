import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type SchedulerNoticeAudience = 'company' | 'departments' | 'employees';

export interface SchedulerNoticeDepartment {
  id: number;
  name: string;
}

export interface SchedulerNoticeEmployee {
  id: string;
  code?: string | null;
  display_name: string;
}

export interface SchedulerNotice {
  id: string;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  audience_type: SchedulerNoticeAudience;
  color?: string | null;
  is_active: boolean;
  department_ids: number[];
  departments: SchedulerNoticeDepartment[];
  employee_ids: string[];
  employees: SchedulerNoticeEmployee[];
}

export interface SchedulerNoticePayload {
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  audience_type: SchedulerNoticeAudience;
  color?: string | null;
  is_active?: boolean;
  department_ids?: number[];
  employee_ids?: string[];
}

export const useSchedulerNoticeStore = defineStore('schedulerNotice', {
  state: () => ({
    notices: [] as SchedulerNotice[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async parseError(response: Response): Promise<string> {
      const body = await response.json().catch(() => ({}));
      const validationMessage = body.errors
        ? Object.values(body.errors as Record<string, string[]>).flat().join(' ')
        : null;
      return validationMessage || body.message || `Request failed (${response.status})`;
    },

    async fetchNotices(start: string, end: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          start,
          end,
          active_only: '1',
        });
        const response = await fetch(`${API_URL}/scheduler-notices?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        this.notices = (body.data ?? []) as SchedulerNotice[];
        return this.notices;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load scheduler notices';
        this.notices = [];
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    async createNotice(payload: SchedulerNoticePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-notices`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        return body.data as SchedulerNotice;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create notice';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateNotice(id: string, payload: SchedulerNoticePayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-notices/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        return body.data as SchedulerNotice;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update notice';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteNotice(id: string) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-notices/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete notice';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchedulerNoticeStore, import.meta.hot));
}
