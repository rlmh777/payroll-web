import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type FormFieldType =
  | 'section'
  | 'score'
  | 'number'
  | 'text'
  | 'textarea'
  | 'select'
  | 'radio'
  | 'checkbox'
  | 'date';

export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormField {
  id: string;
  type: FormFieldType;
  label: string;
  help?: string | null;
  required?: boolean;
  placeholder?: string | null;
  min?: number | null;
  max?: number | null;
  weight?: number | null;
  options?: FormFieldOption[];
}

export interface FormSchema {
  fields: FormField[];
}

export interface FormTemplate {
  id: string;
  name: string;
  description?: string | null;
  purpose: 'score_sheet' | 'general' | 'feedback' | 'appraisal';
  schema: FormSchema;
  is_active: boolean;
  max_score?: number;
  updated_at?: string | null;
}

export interface FormTemplatePayload {
  name: string;
  description?: string | null;
  purpose?: 'score_sheet' | 'general' | 'feedback' | 'appraisal';
  schema: FormSchema;
  is_active?: boolean;
}

export interface FormResponse {
  id?: string;
  form_template_id?: string;
  vacancy_id?: string;
  vacancy_application_id?: string;
  panel_member_id?: string | null;
  user_id?: string;
  scorer?: { name?: string | null; email?: string | null };
  schema?: FormSchema;
  answers: Record<string, unknown>;
  comments?: string | null;
  total_score?: number | null;
  max_score?: number | null;
  percent?: number | null;
  submitted_at?: string | null;
  updated_at?: string | null;
  is_submitted?: boolean;
}

export const FIELD_TYPE_OPTIONS: { label: string; value: FormFieldType; icon: string }[] = [
  { label: 'Section heading', value: 'section', icon: 'view_headline' },
  { label: 'Score', value: 'score', icon: 'star_rate' },
  { label: 'Number', value: 'number', icon: 'pin' },
  { label: 'Short answer', value: 'text', icon: 'short_text' },
  { label: 'Paragraph', value: 'textarea', icon: 'notes' },
  { label: 'Dropdown', value: 'select', icon: 'arrow_drop_down_circle' },
  { label: 'Multiple choice', value: 'radio', icon: 'radio_button_checked' },
  { label: 'Yes / No', value: 'checkbox', icon: 'check_box' },
  { label: 'Date', value: 'date', icon: 'event' },
];

export function emptyField(type: FormFieldType = 'score'): FormField {
  return {
    id: crypto.randomUUID(),
    type,
    label: type === 'section' ? 'Untitled section' : 'Untitled question',
    help: '',
    required: type === 'score',
    placeholder: '',
    min: type === 'score' || type === 'number' ? 0 : null,
    max: type === 'score' ? 10 : null,
    weight: type === 'score' ? 1 : null,
    options: type === 'select' || type === 'radio'
      ? [
          { value: 'option_1', label: 'Option 1' },
          { value: 'option_2', label: 'Option 2' },
        ]
      : [],
  };
}

function authHeaders(): HeadersInit {
  const token = useAuthStore().token;
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function readError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return (body as { message?: string }).message || fallback;
}

export const useFormTemplateStore = defineStore('formTemplates', {
  state: () => ({
    templates: [] as FormTemplate[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),
  getters: {
    scoreSheets: (state) => state.templates.filter((item) => item.purpose === 'score_sheet' && item.is_active),
  },
  actions: {
    async fetchTemplates(filters: { purpose?: string; activeOnly?: boolean; search?: string } = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (filters.purpose) params.set('purpose', filters.purpose);
        if (filters.activeOnly) params.set('active_only', '1');
        if (filters.search) params.set('search', filters.search);
        const query = params.toString();
        const response = await fetch(`${API_URL}/form-templates${query ? `?${query}` : ''}`, {
          headers: authHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load form templates.');
        }
        this.templates = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load form templates.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    async fetchTemplate(id: string): Promise<FormTemplate> {
      const response = await fetch(`${API_URL}/form-templates/${id}`, { headers: authHeaders() });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to load form template.');
      }
      return body.data as FormTemplate;
    },
    async saveTemplate(payload: FormTemplatePayload, id?: string): Promise<FormTemplate> {
      this.isSaving = true;
      try {
        const response = await fetch(id ? `${API_URL}/form-templates/${id}` : `${API_URL}/form-templates`, {
          method: id ? 'PUT' : 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save form template.');
        }
        const saved = body.data as FormTemplate;
        const index = this.templates.findIndex((item) => item.id === saved.id);
        if (index >= 0) {
          this.templates.splice(index, 1, saved);
        } else {
          this.templates.push(saved);
        }
        return saved;
      } finally {
        this.isSaving = false;
      }
    },
    async deleteTemplate(id: string) {
      const response = await fetch(`${API_URL}/form-templates/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(await readError(response, 'Failed to delete form template.'));
      }
      this.templates = this.templates.filter((item) => item.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFormTemplateStore, import.meta.hot));
}
