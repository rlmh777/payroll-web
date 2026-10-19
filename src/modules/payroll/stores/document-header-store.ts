import { defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import {
  GOVERNMENT_REPORT_IDS,
  NONE_HEADER_ID,
  REPORTS_DEFAULT_NONE,
  preloadHeaderLogo,
  type DocumentHeader,
  type DocumentHeaderCanvas,
} from '@payroll/utils/document-header';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const STORAGE_KEY = 'payroll.report-document-header';

function readSelections(): Record<string, string> {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Record<string, string>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const useDocumentHeaderStore = defineStore('documentHeader', {
  state: () => ({
    headers: [] as DocumentHeader[],
    fields: {} as Record<string, string>,
    selections: readSelections(),
    activeReportId: 'journal-entries',
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  getters: {
    activeHeader(state): DocumentHeader | null {
      const selectedId = state.selections[state.activeReportId];
      if (selectedId === NONE_HEADER_ID) {
        return null;
      }
      const selected = state.headers.find((header) => header.id === selectedId);
      if (selected) {
        return selected;
      }
      if (REPORTS_DEFAULT_NONE.has(state.activeReportId)) {
        return null;
      }
      const kind = GOVERNMENT_REPORT_IDS.has(state.activeReportId) ? 'government' : 'company';
      return state.headers.find((header) => header.kind === kind)
        ?? state.headers.find((header) => header.kind === 'company')
        ?? state.headers[0]
        ?? null;
    },
  },

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    setActiveReport(reportId: string) {
      this.activeReportId = reportId;
    },

    selectHeader(reportId: string, headerId: string) {
      this.activeReportId = reportId;
      this.selections = {
        ...this.selections,
        [reportId]: headerId || NONE_HEADER_ID,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.selections));
    },

    async fetchHeaders(): Promise<boolean> {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/report-document-headers`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(typeof body.message === 'string' ? body.message : 'Failed to load document headers.');
        }
        this.headers = (body.headers ?? []) as DocumentHeader[];
        this.fields = (body.fields ?? {}) as Record<string, string>;
        await preloadHeaderLogo(this.fields['company.logo'] || '');
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load document headers.';
        return false;
      } finally {
        this.isLoading = false;
      }
    },

    async saveHeader(header: DocumentHeader, canvas: DocumentHeaderCanvas, name: string): Promise<boolean> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/report-document-headers/${header.id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name, canvas }),
        });
        const body = await response.json().catch(() => ({} as DocumentHeader));
        if (!response.ok) {
          throw new Error(typeof (body as { message?: string }).message === 'string'
            ? (body as { message: string }).message
            : 'Failed to save the header.');
        }
        const saved = body as DocumentHeader;
        this.headers = this.headers.map((item) => (item.id === saved.id ? saved : item));
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save the header.';
        return false;
      } finally {
        this.isSaving = false;
      }
    },

    async createHeader(name: string, canvas: DocumentHeaderCanvas): Promise<DocumentHeader | null> {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/report-document-headers`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ name, canvas }),
        });
        const body = await response.json().catch(() => ({} as DocumentHeader));
        if (!response.ok) {
          throw new Error(typeof (body as { message?: string }).message === 'string'
            ? (body as { message: string }).message
            : 'Failed to create the header.');
        }
        const created = body as DocumentHeader;
        this.headers = [...this.headers, created];
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create the header.';
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteHeader(header: DocumentHeader): Promise<boolean> {
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/report-document-headers/${header.id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({} as { message?: string }));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to delete the header.');
        }
        this.headers = this.headers.filter((item) => item.id !== header.id);
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete the header.';
        return false;
      }
    },
  },
});
