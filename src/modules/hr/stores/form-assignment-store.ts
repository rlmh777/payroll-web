import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { FormResponse, FormTemplate } from '@hr/stores/form-template-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type FormAudienceType = 'company' | 'departments' | 'employee_groups' | 'employees';

export interface FormAssignment {
  id: string;
  form_template_id: string;
  name?: string | null;
  audience_type: FormAudienceType;
  show_on_login: boolean;
  is_required: boolean;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  pipeline_template_id?: string | null;
  pipeline_template?: { id: string; name: string; key: string } | null;
  department_ids: number[];
  departments: { id: number; name: string }[];
  employee_group_ids: string[];
  employee_groups: { id: string; name: string }[];
  employee_ids: string[];
  employees: { id: string; code?: string | null; name?: string | null }[];
  response_count?: number | null;
  form_template?: FormTemplate | null;
  is_submitted?: boolean;
  has_draft?: boolean;
  response?: FormResponse | null;
}

export interface FormAssignmentPayload {
  name?: string | null;
  audience_type: FormAudienceType;
  show_on_login?: boolean;
  is_required?: boolean;
  is_active?: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  pipeline_template_id?: string | null;
  department_ids?: number[];
  employee_group_ids?: string[];
  employee_ids?: string[];
}

export const useFormAssignmentStore = defineStore('formAssignments', {
  state: () => ({
    assignments: [] as FormAssignment[],
    pending: [] as FormAssignment[],
    isLoading: false,
    isSaving: false,
    pendingFetchedAt: 0,
    error: null as string | null,
  }),
  getters: {
    nextRequired: (state) =>
      state.pending.find((item) => item.is_required && item.show_on_login && !item.is_submitted) ?? null,
  },
  actions: {
    authHeaders(): HeadersInit {
      const token = useAuthStore().token;
      return {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };
    },
    async parseError(response: Response, fallback: string) {
      const body = await response.json().catch(() => ({}));
      const validation = body.errors
        ? Object.values(body.errors as Record<string, string[]>).flat().join(' ')
        : null;
      return validation || body.message || fallback;
    },
    async fetchAssignments(templateId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/form-templates/${templateId}/assignments`, {
          headers: this.authHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load assignments.');
        }
        this.assignments = Array.isArray(body.data) ? body.data : [];
      } finally {
        this.isLoading = false;
      }
    },
    async saveAssignment(templateId: string, payload: FormAssignmentPayload, id?: string) {
      this.isSaving = true;
      try {
        const response = await fetch(
          id ? `${API_URL}/form-assignments/${id}` : `${API_URL}/form-templates/${templateId}/assignments`,
          {
            method: id ? 'PUT' : 'POST',
            headers: this.authHeaders(),
            body: JSON.stringify(payload),
          },
        );
        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to save assignment.'));
        }
        const body = await response.json();
        await this.fetchAssignments(templateId);
        return body.data as FormAssignment;
      } finally {
        this.isSaving = false;
      }
    },
    async deleteAssignment(id: string, templateId: string) {
      const response = await fetch(`${API_URL}/form-assignments/${id}`, {
        method: 'DELETE',
        headers: this.authHeaders(),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response, 'Failed to delete assignment.'));
      }
      await this.fetchAssignments(templateId);
    },
    async fetchPending(options: { force?: boolean } = {}) {
      if (!options.force && this.pendingFetchedAt && Date.now() - this.pendingFetchedAt < 15000) {
        return this.pending;
      }
      const response = await fetch(`${API_URL}/my-forms`, {
        headers: this.authHeaders(),
      });
      if (!response.ok) {
        this.pending = [];
        this.pendingFetchedAt = Date.now();
        return this.pending;
      }
      const body = await response.json().catch(() => ({}));
      this.pending = Array.isArray(body.data) ? body.data : [];
      this.pendingFetchedAt = Date.now();
      return this.pending;
    },
    async fetchMine(id: string): Promise<FormAssignment> {
      const response = await fetch(`${API_URL}/my-forms/${id}`, {
        headers: this.authHeaders(),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response, 'Failed to load form.'));
      }
      const body = await response.json();
      return body.data as FormAssignment;
    },
    async submitMine(id: string, payload: { answers: Record<string, unknown>; comments?: string; submit?: boolean }) {
      const response = await fetch(`${API_URL}/my-forms/${id}`, {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response, 'Failed to save form.'));
      }
      this.pendingFetchedAt = 0;
      return (await response.json()).data as FormResponse;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormAssignmentStore, import.meta.hot));
}
