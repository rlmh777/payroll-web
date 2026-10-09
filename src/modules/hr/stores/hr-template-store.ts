import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export type HrTemplateChannel = 'letter' | 'email';

export interface HrTemplate {
  id: string;
  channel: HrTemplateChannel;
  category: string;
  system_key: string | null;
  name: string;
  subject: string | null;
  body: string;
  is_system: boolean;
  is_active: boolean;
  updated_at?: string | null;
}

export interface HrTemplatePayload {
  channel: HrTemplateChannel;
  category: string;
  name: string;
  subject?: string | null;
  body: string;
  is_active: boolean;
}

export interface HrTemplatePlaceholder {
  token: string;
  label: string;
}

export interface HrTemplateCategoryOption {
  value: string;
  label: string;
}

export const useHrTemplateStore = defineStore('hrTemplate', {
  state: () => ({
    templates: [] as HrTemplate[],
    placeholders: [] as HrTemplatePlaceholder[],
    categories: [] as HrTemplateCategoryOption[],
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
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

    async fetchTemplates(channel: HrTemplateChannel, search = '') {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ channel });
        if (search.trim()) {
          params.set('search', search.trim());
        }
        const response = await fetch(`${API_URL}/hr-templates?${params}`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          const validationMessage = body.errors
            ? Object.values(body.errors as Record<string, string[]>).flat().join(' ')
            : null;
          throw new Error(validationMessage || body.message || 'Failed to load templates.');
        }
        this.templates = Array.isArray(body.data) ? body.data : [];
        this.placeholders = Array.isArray(body.meta?.placeholders) ? body.meta.placeholders : [];
        this.categories = Array.isArray(body.meta?.categories) ? body.meta.categories : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load templates.';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async saveTemplate(payload: HrTemplatePayload, id?: string | null): Promise<HrTemplate> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(id ? `${API_URL}/hr-templates/${id}` : `${API_URL}/hr-templates`, {
          method: id ? 'PUT' : 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }
        const body = await response.json().catch(() => ({}));
        return body.data as HrTemplate;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save template.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteTemplate(id: string) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/hr-templates/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }
        this.templates = this.templates.filter((item) => item.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete template.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useHrTemplateStore, import.meta.hot));
}
