import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface WorkTimesheetDepartment {
  id: string;
  work_timesheet_id: string;
  department_id: number;
  effective_date: string;
  notes?: string | null;
  work_timesheet?: { id: string; name: string };
  department?: { id: number; name: string };
}

export interface DepartmentOption {
  id: number;
  name: string;
}

export const useWorkShiftDepartmentStore = defineStore('workShiftDepartment', {
  state: () => ({
    assignments: [] as WorkTimesheetDepartment[],
    departments: [] as DepartmentOption[],
    isLoading: false,
    error: null as string | null,
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
    async fetchDepartments() {
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/departments`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to load departments: ${response.statusText}`);
        }

        const data = await response.json();
        const departments = Array.isArray(data?.data) ? data.data : data;
        this.departments = Array.isArray(departments) ? departments : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load departments';
      }
    },
    async fetchAssignments() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/work-timesheet-departments`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(`Failed to load assignments: ${response.statusText}`);
        }

        const data = await response.json();
        this.assignments = Array.isArray(data) ? data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load assignments';
      } finally {
        this.isLoading = false;
      }
    },
    async createAssignments(payload: {
      work_timesheet_id: string;
      department_ids: number[];
      effective_date: string;
      notes?: string;
    }) {
      this.isLoading = true;
      this.error = null;

      try {
        await Promise.all(
          payload.department_ids.map((departmentId) =>
            fetch(`${API_URL}/work-timesheet-departments`, {
              method: 'POST',
              headers: this.buildHeaders(),
              body: JSON.stringify({
                work_timesheet_id: payload.work_timesheet_id,
                department_id: departmentId,
                effective_date: payload.effective_date,
                notes: payload.notes,
              }),
            }).then(async (response) => {
              if (!response.ok) {
                const errorBody = await response.json().catch(() => ({}));
                throw new Error(errorBody.message || 'Failed to save assignment.');
              }
            }),
          ),
        );

        await this.fetchAssignments();
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save assignments';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useWorkShiftDepartmentStore, import.meta.hot));
}
