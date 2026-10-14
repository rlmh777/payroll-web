import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export interface ApplicationLogFile {
  name: string;
  sizeBytes: number;
  modifiedAt: string | null;
}

export interface ApplicationLogEntry {
  timestamp: string | null;
  environment: string | null;
  level: string;
  message: string;
  raw: string;
}

export interface ApplicationLogPayload {
  channel: string;
  stack: string[] | null;
  directory: string;
  files: ApplicationLogFile[];
  file: string | null;
  lines: number;
  search: string | null;
  level: string | null;
  sizeBytes: number;
  modifiedAt: string | null;
  content: string;
  entries: ApplicationLogEntry[];
  truncated: boolean;
}

export interface ApplicationLogQuery {
  file?: string | null;
  lines?: number;
  search?: string;
  level?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useApplicationLogStore = defineStore('applicationLogs', {
  state: () => ({
    payload: null as ApplicationLogPayload | null,
    isLoading: false,
    isClearing: false,
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

    buildQuery(query: ApplicationLogQuery): string {
      const params = new URLSearchParams();
      if (query.file) {
        params.set('file', query.file);
      }
      if (query.lines) {
        params.set('lines', String(query.lines));
      }
      if (query.search?.trim()) {
        params.set('search', query.search.trim());
      }
      if (query.level) {
        params.set('level', query.level);
      }
      const encoded = params.toString();
      return encoded ? `?${encoded}` : '';
    },

    async fetchLogs(query: ApplicationLogQuery = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/application-logs${this.buildQuery(query)}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load application logs');
        }
        this.payload = (await response.json()) as ApplicationLogPayload;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load application logs';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async clearLogs(
      file: string | null | undefined,
      confirmation: { challenge_key: string; confirmation_code: string },
    ) {
      this.isClearing = true;
      this.error = null;
      try {
        const query: ApplicationLogQuery = {};
        if (file) {
          query.file = file;
        }
        const response = await fetch(
          `${API_URL}/application-logs${this.buildQuery(query)}`,
          {
            method: 'DELETE',
            headers: this.buildHeaders(),
            body: JSON.stringify({
              file: file || null,
              challenge_key: confirmation.challenge_key,
              confirmation_code: confirmation.confirmation_code,
            }),
          },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to clear application logs');
        }
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to clear application logs';
        throw error;
      } finally {
        this.isClearing = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useApplicationLogStore, import.meta.hot));
}
