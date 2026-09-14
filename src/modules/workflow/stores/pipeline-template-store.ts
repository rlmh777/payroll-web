import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type PipelineStepDraft = {
  id?: string | null;
  key: string;
  label: string;
  sortOrder: number;
  assigneeType: string;
  assigneeRole?: string | null;
  domainStatus?: string | null;
  actions: string[];
  uiConfig?: Record<string, unknown>;
};

export type PipelineTemplate = {
  id: string;
  key: string;
  name: string;
  subjectType: string;
  description?: string | null;
  completionStatus?: string | null;
  rejectionStatus?: string | null;
  cancellationStatus?: string | null;
  isActive: boolean;
  steps: PipelineStepDraft[];
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type PipelineMetaOption = { value: string; label: string };

export const usePipelineTemplateStore = defineStore('pipelineTemplate', {
  state: () => ({
    templates: [] as PipelineTemplate[],
    isLoading: false,
    error: null as string | null,
    meta: {
      subjectTypes: [] as PipelineMetaOption[],
      assigneeTypes: [] as PipelineMetaOption[],
      actions: [] as PipelineMetaOption[],
    },
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

    async fetchMeta() {
      const response = await fetch(`${API_URL}/pipeline-templates/meta`, {
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
      this.meta = await response.json();
    },

    async fetchTemplates() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/pipeline-templates`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }
        const data = await response.json();
        this.templates = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load pipeline templates.';
        this.templates = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createTemplate(payload: Omit<PipelineTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
      const response = await fetch(`${API_URL}/pipeline-templates`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
      const created = await response.json() as PipelineTemplate;
      this.templates = [...this.templates, created].sort((a, b) => a.name.localeCompare(b.name));
      return created;
    },

    async updateTemplate(id: string, payload: Omit<PipelineTemplate, 'id' | 'createdAt' | 'updatedAt'>) {
      const response = await fetch(`${API_URL}/pipeline-templates/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
      const updated = await response.json() as PipelineTemplate;
      this.templates = this.templates.map((row) => (row.id === id ? updated : row));
      return updated;
    },

    async deleteTemplate(id: string) {
      const response = await fetch(`${API_URL}/pipeline-templates/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(await this.parseError(response));
      }
      this.templates = this.templates.filter((row) => row.id !== id);
    },

    async parseError(response: Response) {
      const body = await response.json().catch(() => ({}));
      return body.message || `Request failed (${response.status})`;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePipelineTemplateStore, import.meta.hot));
}
