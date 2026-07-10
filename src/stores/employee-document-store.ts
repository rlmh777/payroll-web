import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { DocumentTag } from './document-tag-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface EmployeeDocument {
  id: string;
  employeeId: string;
  documentTagId?: string | null;
  name: string;
  description?: string | null;
  filePath?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  fileUrl?: string | null;
  documentTag?: DocumentTag | null;
}

export interface EmployeeDocumentPayload {
  employeeId: string;
  documentTagId?: string | null;
  name: string;
  description?: string | null;
}

export const useEmployeeDocumentStore = defineStore('employeeDocument', {
  state: () => ({
    records: [] as EmployeeDocument[],
    isLoading: false,
    recordToEdit: null as EmployeeDocument | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(includeJsonContentType = true) {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};
      if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
      }
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    buildRequestBody(
      payload: EmployeeDocumentPayload | Partial<EmployeeDocumentPayload>,
      documentFile?: File | null,
    ): { body: BodyInit; headers: HeadersInit } {
      if (!documentFile) {
        return {
          body: JSON.stringify(payload),
          headers: this.buildHeaders(true),
        };
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) {
          return;
        }
        if (value === null) {
          formData.append(key, '');
          return;
        }
        formData.append(key, String(value));
      });
      formData.append('documentFile', documentFile);

      return {
        body: formData,
        headers: this.buildHeaders(false),
      };
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ employeeId, per_page: '50' });
        const response = await fetch(`${API_URL}/employee-documents?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load documents');
        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading documents';
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: EmployeeDocumentPayload, documentFile?: File | null) {
      const { body, headers } = this.buildRequestBody(payload, documentFile);
      const response = await fetch(`${API_URL}/employee-documents`, {
        method: 'POST',
        headers,
        body,
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(responseBody) || 'Create failed');
      }
    },

    async updateRecord(
      id: string,
      payload: Partial<EmployeeDocumentPayload>,
      documentFile?: File | null,
    ) {
      const { body, headers } = this.buildRequestBody(payload, documentFile);
      const response = await fetch(`${API_URL}/employee-documents/${id}`, {
        method: documentFile ? 'POST' : 'PUT',
        headers,
        body,
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(responseBody) || 'Update failed');
      }
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-documents/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.records = this.records.filter((record) => record.id !== id);
    },

    extractErrorMessage(body: Record<string, unknown>): string | null {
      if (typeof body.message === 'string') {
        return body.message;
      }

      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const first = Object.values(errors)[0];
        if (Array.isArray(first) && typeof first[0] === 'string') {
          return first[0];
        }
      }

      return null;
    },

    setRecordToEdit(record: EmployeeDocument | null) {
      this.recordToEdit = record ? { ...record } : null;
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeDocumentStore, import.meta.hot));
}
