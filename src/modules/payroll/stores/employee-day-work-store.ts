import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface DayWorkEmployeeOption {
  id: string;
  code?: string | null;
  firstName?: string;
  lastName?: string;
  displayName: string;
  employmentDetailId?: string | null;
  departmentId?: number | null;
  employeeCompensationId?: string | null;
  dailyRate: number;
}

export interface EmployeeDayWork {
  id: string;
  employeeId: string;
  employmentDetailId?: string | null;
  employeeCompensationId?: string | null;
  departmentId?: number | null;
  date: string;
  units: number;
  dailyRate: number;
  amount: number;
  note?: string | null;
  approvalStatus?: string;
  employee?: {
    id: string;
    code?: string | null;
    firstName?: string;
    lastName?: string;
  } | null;
}

interface DayWorkPayload {
  employeeId: string;
  date: string;
  units: number;
  dailyRate?: number;
  note?: string;
}

function authHeaders(): HeadersInit {
  const authStore = useAuthStore();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (authStore.token) {
    headers.Authorization = `Bearer ${authStore.token}`;
  }
  return headers;
}

function extractError(body: Record<string, unknown>, fallback: string): string {
  if (typeof body.message === 'string' && body.message) {
    return body.message;
  }
  const errors = body.errors;
  if (errors && typeof errors === 'object') {
    const first = Object.values(errors as Record<string, string[] | string>)[0];
    if (Array.isArray(first) && first[0]) return String(first[0]);
    if (typeof first === 'string') return first;
  }
  return fallback;
}

function defaultDateRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export const useEmployeeDayWorkStore = defineStore('employeeDayWork', {
  state: () => {
    const range = defaultDateRange();
    return {
      entries: [] as EmployeeDayWork[],
      employees: [] as DayWorkEmployeeOption[],
      selectedEmployeeId: null as string | null,
      startDate: range.start,
      endDate: range.end,
      isBootstrapping: false,
      isLoading: false,
      isSaving: false,
      currentPage: 1,
      lastPage: 1,
      total: 0,
      error: null as string | null,
    };
  },

  actions: {
    async bootstrap() {
      this.isBootstrapping = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-day-works/bootstrap`, {
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to load day / trip work options.'));
        }

        const data = await response.json();
        this.employees = data.employees ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load day / trip work options.';
      } finally {
        this.isBootstrapping = false;
      }
    },

    async fetchEntries(page?: number, perPage = 25) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({
          page: String(page ?? this.currentPage),
          per_page: String(perPage),
        });
        if (this.startDate) params.append('start_date', this.startDate);
        if (this.endDate) params.append('end_date', this.endDate);
        if (this.selectedEmployeeId) params.append('employee_id', this.selectedEmployeeId);

        const response = await fetch(`${API_URL}/employee-day-works?${params}`, {
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to load day / trip work entries.'));
        }

        const data = await response.json();
        this.entries = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load day / trip work entries.';
        this.entries = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createEntry(payload: DayWorkPayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-day-works`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to create day / trip work entry.'));
        }
        await this.fetchEntries(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create day / trip work entry.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateEntry(id: string, payload: Partial<DayWorkPayload>) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-day-works/${id}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to update day / trip work entry.'));
        }
        await this.fetchEntries(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update day / trip work entry.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteEntry(id: string) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-day-works/${id}`, {
          method: 'DELETE',
          headers: authHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(extractError(body, 'Failed to delete day / trip work entry.'));
        }
        await this.fetchEntries(this.currentPage);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete day / trip work entry.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeDayWorkStore, import.meta.hot));
}
