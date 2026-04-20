import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface WorkTimesheetSummary {
  id: string;
  name: string;
}

export interface Department {
  id: number;
  name: string;
  parentId?: number | null;
  parent?: Department | null;
  current_work_timesheet_assignment?: {
    id: string;
    work_timesheet_id: string;
    effective_date: string;
    notes?: string | null;
    work_timesheet?: WorkTimesheetSummary | null;
  } | null;
}

export interface DepartmentPayload {
  name: string;
  parentId?: number | null;
  work_timesheet_id?: string | null;
}

export const useDepartmentStore = defineStore('department', {
  state: () => ({
    departments: [] as Department[],
    departmentOptions: [] as Department[],
    isLoading: false,
    isSaving: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    isCreateOpen: false,
    departmentToEdit: null as Department | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    async fetchDepartments(params: { page?: number; perPage?: number; search?: string } = {}) {
      this.isLoading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams({
          page: String(params.page ?? this.currentPage),
          per_page: String(params.perPage ?? 10),
        });
        const search = params.search ?? this.search;

        if (search) {
          queryParams.append('search', search);
        }

        const response = await fetch(`${API_URL}/departments?${queryParams.toString()}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch departments: ${response.statusText}`);
        }

        const data = await response.json();
        this.departments = Array.isArray(data.data) ? data.data : data;
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.departments.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading departments';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchDepartmentOptions() {
      try {
        const response = await fetch(`${API_URL}/departments?per_page=1000`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch department options: ${response.statusText}`);
        }

        const data = await response.json();
        const departments = Array.isArray(data.data) ? data.data : data;
        this.departmentOptions = Array.isArray(departments) ? departments : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading department options';
      }
    },

    async createDepartment(payload: DepartmentPayload): Promise<Department | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/departments`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || errorBody.error || 'Failed to create department.');
        }

        const result = await response.json();
        await Promise.all([this.fetchDepartments(), this.fetchDepartmentOptions()]);
        return result.data ?? result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating department';
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async updateDepartment(id: number, payload: DepartmentPayload): Promise<Department | null> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || errorBody.error || 'Failed to update department.');
        }

        const result = await response.json();
        await Promise.all([this.fetchDepartments(), this.fetchDepartmentOptions()]);
        return result.data ?? result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating department';
        return null;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteDepartment(id: number): Promise<boolean> {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/departments/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || errorBody.error || 'Failed to delete department.');
        }

        await Promise.all([this.fetchDepartments(), this.fetchDepartmentOptions()]);
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting department';
        return false;
      } finally {
        this.isSaving = false;
      }
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },

    setDepartmentToEdit(department: Department | null) {
      this.departmentToEdit = department ? { ...department } : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDepartmentStore, import.meta.hot));
}
