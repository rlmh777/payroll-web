import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type {
  EmployeeFormFieldCatalogItem,
  EmployeeFormFieldInputType,
  EmployeeFormFieldOption,
  EmployeeFormTabCatalogItem,
} from '@core/types/employee-form-access';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeFormFieldPayload {
  label: string;
  tab_key: string;
  key?: string | null;
  input_type: EmployeeFormFieldInputType;
  is_required?: boolean;
  options?: EmployeeFormFieldOption[];
  help_text?: string | null;
  is_active?: boolean;
}

export interface EmployeeFormCatalog {
  form: string;
  tabs: EmployeeFormTabCatalogItem[];
  fields: EmployeeFormFieldCatalogItem[];
  input_types: EmployeeFormFieldInputType[];
}

function authHeaders(): HeadersInit {
  const token = useAuthStore().token;
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function messageFromBody(body: unknown, fallback: string): string {
  const payload = (body ?? {}) as {
    message?: string;
    errors?: Record<string, string[] | string>;
  };
  const errors = payload.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors)[0];
    if (Array.isArray(first) && first[0]) {
      return String(first[0]);
    }
    if (typeof first === 'string' && first) {
      return first;
    }
  }
  return payload.message || fallback;
}

export const useEmployeeFormFieldStore = defineStore('employeeFormFields', {
  state: () => ({
    tabs: [] as EmployeeFormTabCatalogItem[],
    fields: [] as EmployeeFormFieldCatalogItem[],
    inputTypes: ['text', 'textarea', 'number', 'date', 'select', 'toggle'] as EmployeeFormFieldInputType[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  getters: {
    activeCustomFields: (state) =>
      state.fields.filter((field) => field.is_system === false && field.is_active !== false),
    fieldsForTab: (state) => (tab: string) =>
      state.fields.filter((field) => field.tab === tab && field.is_system === false && field.is_active !== false),
  },
  actions: {
    async fetchCatalog(includeInactive = false) {
      this.isLoading = true;
      this.error = null;
      try {
        const query = includeInactive ? '?include_inactive=1' : '';
        const response = await fetch(`${API_URL}/form-access/employee${query}`, {
          headers: authHeaders(),
        });
        const body = (await response.json().catch(() => ({}))) as Partial<EmployeeFormCatalog> & {
          message?: string;
          errors?: Record<string, string[] | string>;
        };
        if (!response.ok) {
          throw new Error(messageFromBody(body, 'Failed to load employee fields.'));
        }
        this.tabs = Array.isArray(body.tabs) ? body.tabs : [];
        this.fields = Array.isArray(body.fields) ? body.fields : [];
        if (Array.isArray(body.input_types) && body.input_types.length > 0) {
          this.inputTypes = body.input_types;
        }
        return body;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load employee fields.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async createField(payload: EmployeeFormFieldPayload): Promise<EmployeeFormFieldCatalogItem> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/form-access/employee/fields`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(messageFromBody(body, 'Failed to create employee field.'));
        }
        const field = (body as { data: EmployeeFormFieldCatalogItem }).data;
        await this.fetchCatalog(true);
        return field;
      } finally {
        this.isSaving = false;
      }
    },
    async updateField(id: string, payload: EmployeeFormFieldPayload): Promise<EmployeeFormFieldCatalogItem> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/form-access/employee/fields/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(messageFromBody(body, 'Failed to save employee field.'));
        }
        const field = (body as { data: EmployeeFormFieldCatalogItem }).data;
        await this.fetchCatalog(true);
        return field;
      } finally {
        this.isSaving = false;
      }
    },
    async deleteField(id: string): Promise<void> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/form-access/employee/fields/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(messageFromBody(body, 'Failed to delete employee field.'));
        }
        await this.fetchCatalog(true);
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeFormFieldStore, import.meta.hot));
}
