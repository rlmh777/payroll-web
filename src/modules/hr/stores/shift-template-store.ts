import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface ShiftTemplateDepartment {
  id: number;
  name: string;
}

export interface ShiftTemplateSegment {
  start_time: string;
  end_time: string;
}

export interface ShiftTemplate {
  id: string;
  name: string | null;
  display_label?: string;
  segments: ShiftTemplateSegment[];
  include_lunch_hour: boolean;
  lunch_hour_hours: number;
  is_active: boolean;
  department_ids: number[];
  departments: ShiftTemplateDepartment[];
}

export interface ShiftTemplatePayload {
  name?: string | null;
  segments: ShiftTemplateSegment[];
  include_lunch_hour?: boolean;
  lunch_hour_hours?: number;
  is_active?: boolean;
  department_ids?: number[];
}

export function shiftTemplateDisplayLabel(template: ShiftTemplate): string {
  const named = template.display_label?.trim() || template.name?.trim();
  if (named) {
    return named;
  }

  const times = template.segments
    .map((segment) => `${segment.start_time}–${segment.end_time}`)
    .join(' / ');

  if (!times) {
    return 'Shift';
  }

  return template.include_lunch_hour ? `${times} (w/ lunch)` : times;
}

export function shiftTemplateSearchText(template: ShiftTemplate): string {
  return [
    shiftTemplateDisplayLabel(template),
    template.name,
    ...template.segments.flatMap((segment) => [segment.start_time, segment.end_time]),
    ...template.departments.map((department) => department.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export interface ShiftTemplateAssignPayload {
  employeeId: string;
  date: string;
  endDate?: string | null;
  employmentDetailId?: string | null;
  departmentId?: number | null;
  worksiteId?: number | null;
  description?: string | null;
}

export const useShiftTemplateStore = defineStore('shiftTemplate', {
  state: () => ({
    templates: [] as ShiftTemplate[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  getters: {
    activeTemplates(state): ShiftTemplate[] {
      return state.templates.filter((template) => template.is_active);
    },
  },

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

    templatesForDepartment(departmentId: number | null | undefined): ShiftTemplate[] {
      if (departmentId == null) {
        return this.activeTemplates;
      }

      return this.activeTemplates.filter((template) => {
        if (!template.department_ids.length) {
          return true;
        }
        return template.department_ids.includes(departmentId);
      });
    },

    async ensureTemplatesLoaded(options: { force?: boolean; activeOnly?: boolean } = {}) {
      if (
        !options.force
        && this.templates.length > 0
        && !this.error
      ) {
        return this.templates;
      }

      if (this.isLoading) {
        return this.templates;
      }

      return this.fetchTemplates({
        activeOnly: options.activeOnly ?? true,
      });
    },

    async fetchTemplates(options: { activeOnly?: boolean; departmentId?: number | null } = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        if (options.activeOnly === false) {
          params.set('active_only', '0');
        } else {
          params.set('active_only', '1');
        }
        if (options.departmentId != null) {
          params.set('department_id', String(options.departmentId));
        }

        const query = params.toString();
        const response = await fetch(`${API_URL}/shift-templates${query ? `?${query}` : ''}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        this.templates = (body.data ?? []) as ShiftTemplate[];
        return this.templates;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load shift templates';
        this.templates = [];
        return [];
      } finally {
        this.isLoading = false;
      }
    },

    async createTemplate(payload: ShiftTemplatePayload): Promise<ShiftTemplate | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/shift-templates`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        const template = body.data as ShiftTemplate;
        this.templates = [...this.templates.filter((item) => item.id !== template.id), template]
          .sort((left, right) => shiftTemplateDisplayLabel(left).localeCompare(shiftTemplateDisplayLabel(right)));
        return template;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create shift template';
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async updateTemplate(id: string, payload: ShiftTemplatePayload): Promise<ShiftTemplate | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/shift-templates/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        const template = body.data as ShiftTemplate;
        this.templates = this.templates
          .map((item) => (item.id === id ? template : item))
          .sort((left, right) => shiftTemplateDisplayLabel(left).localeCompare(shiftTemplateDisplayLabel(right)));
        return template;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update shift template';
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteTemplate(id: string): Promise<boolean> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/shift-templates/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        this.templates = this.templates.filter((item) => item.id !== id);
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete shift template';
        return false;
      } finally {
        this.isSaving = false;
      }
    },

    async assignTemplate(id: string, payload: ShiftTemplateAssignPayload): Promise<unknown[] | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/shift-templates/${id}/assign`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        return (body.data ?? []) as unknown[];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to assign shift template';
        return null;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useShiftTemplateStore, import.meta.hot));
}
