import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface JobTitle {
  id: number;
  name: string;
  payScale?: string | null;
  notes?: string | null;
  jobDescriptionPath?: string | null;
  jobDescriptionUrl?: string | null;
}

export interface JobTitlePayload {
  name: string;
  payScale?: string | null;
  notes?: string | null;
  removeJobDescription?: boolean;
}

export const useJobTitleStore = defineStore('job-title', {
  state: () => ({
    jobTitles: [] as JobTitle[],
    isLoading: false,
    isLoadingJobTitles: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    jobTitleToEdit: null as JobTitle | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders(includeJsonContentType = true) {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};
      if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
      }
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    buildRequestBody(
      payload: JobTitlePayload | Partial<JobTitlePayload>,
      jobDescriptionFile?: File | null,
    ): { body: BodyInit; headers: HeadersInit } {
      if (!jobDescriptionFile && !payload.removeJobDescription) {
        return {
          body: JSON.stringify(payload),
          headers: this.buildHeaders(true),
        };
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
          return;
        }
        formData.append(key, String(value));
      });
      if (jobDescriptionFile) {
        formData.append('jobDescription', jobDescriptionFile);
      }

      return {
        body: formData,
        headers: this.buildHeaders(false),
      };
    },

    async fetchJobTitles(page?: number, perPage?: number) {
      if (this.isLoadingJobTitles) return;
      this.isLoadingJobTitles = true;
      this.error = null;

      try {
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 15;
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });
        if (this.search) queryParams.append('search', this.search);

        const response = await fetch(`${API_URL}/job-titles?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to load job titles.');
        }

        const data = await response.json();
        this.jobTitles = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading job titles';
      } finally {
        this.isLoadingJobTitles = false;
      }
    },

    async createJobTitle(
      payload: JobTitlePayload,
      jobDescriptionFile?: File | null,
    ): Promise<JobTitle | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const { body, headers } = this.buildRequestBody(payload, jobDescriptionFile);
        const response = await fetch(`${API_URL}/job-titles`, {
          method: 'POST',
          headers,
          body,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            this.extractErrorMessage(errorData) || 'Failed to create job title.',
          );
        }

        const result = await response.json();
        const created = (result.data || result) as JobTitle;
        await this.fetchJobTitles(this.currentPage);
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating job title';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateJobTitle(
      id: number,
      payload: Partial<JobTitlePayload>,
      jobDescriptionFile?: File | null,
    ): Promise<JobTitle | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const { body, headers } = this.buildRequestBody(payload, jobDescriptionFile);
        const useMultipart = body instanceof FormData;
        if (useMultipart) {
          body.append('_method', 'PUT');
        }

        const response = await fetch(`${API_URL}/job-titles/${id}`, {
          method: useMultipart ? 'POST' : 'PUT',
          headers,
          body,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            this.extractErrorMessage(errorData) || 'Failed to update job title.',
          );
        }

        const result = await response.json();
        await this.fetchJobTitles(this.currentPage);
        return (result.data || result) as JobTitle;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating job title';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteJobTitle(id: number) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/job-titles/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            this.extractErrorMessage(errorData) || 'Failed to delete job title.',
          );
        }

        this.jobTitles = this.jobTitles.filter((item) => item.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting job title';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    extractErrorMessage(body: Record<string, unknown>): string | null {
      const error = body.error;
      if (typeof error === 'string') return error;
      if (error && typeof error === 'object') {
        const firstField = Object.values(error)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }
      return typeof body.message === 'string' ? body.message : null;
    },

    setJobTitleToEdit(jobTitle: JobTitle | null) {
      this.jobTitleToEdit = jobTitle ? { ...jobTitle } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useJobTitleStore, import.meta.hot));
}
