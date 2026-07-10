import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface DepartmentHeadAssignment {
  id: string;
  departmentId: number;
  departmentName?: string | null;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  startDate: string;
  endDate?: string | null;
  isCurrent: boolean;
  appointedById?: string | null;
  appointedByName?: string | null;
  notes?: string | null;
}

export interface DepartmentHeadAssignmentPayload {
  departmentId: number;
  employeeId: string;
  startDate: string;
  notes?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useDepartmentHeadStore = defineStore('departmentHead', {
  state: () => ({
    assignments: [] as DepartmentHeadAssignment[],
    isLoading: false,
    isLoadingAssignments: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    filterDepartmentId: null as number | null,
    filterCurrentOnly: false,
    error: null as string | null,
    assignmentToEdit: null as DepartmentHeadAssignment | null,
    isCreateOpen: false,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    async fetchAssignments(page?: number, perPage?: number) {
      if (this.isLoadingAssignments) {
        return;
      }

      this.isLoadingAssignments = true;
      this.error = null;

      try {
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 10;
        const params = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
          sortBy: 'startDate',
          sortDirection: 'desc',
        });

        if (this.search.trim()) {
          params.append('search', this.search.trim());
        }

        if (this.filterDepartmentId != null) {
          params.append('departmentId', String(this.filterDepartmentId));
        }

        if (this.filterCurrentOnly) {
          params.append('isCurrent', '1');
        }

        const response = await fetch(`${API_URL}/department-head-assignments?${params.toString()}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to fetch department head assignments.');
        }

        const data = await response.json();
        this.assignments = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading department head assignments';
        return null;
      } finally {
        this.isLoadingAssignments = false;
      }
    },

    async createAssignment(payload: DepartmentHeadAssignmentPayload) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/department-head-assignments`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Failed to appoint department head.');
        }

        await this.fetchAssignments();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error appointing department head';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async updateAssignment(
      id: string,
      payload: { notes?: string | null; endDate?: string | null },
    ) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/department-head-assignments/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(this.extractErrorMessage(errorBody) || 'Failed to update department head assignment.');
        }

        await this.fetchAssignments();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating department head assignment';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteAssignment(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/department-head-assignments/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || 'Failed to delete department head assignment.');
        }

        this.assignments = this.assignments.filter((item) => item.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting department head assignment';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    extractErrorMessage(body: Record<string, unknown>): string | null {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const firstField = Object.values(errors)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }

      return typeof body.message === 'string' ? body.message : null;
    },

    setAssignmentToEdit(assignment: DepartmentHeadAssignment | null) {
      this.assignmentToEdit = assignment ? { ...assignment } : null;
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
  import.meta.hot.accept(acceptHMRUpdate(useDepartmentHeadStore, import.meta.hot));
}
