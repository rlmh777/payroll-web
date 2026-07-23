import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface TimeTravelChange {
  field: string;
  old: unknown;
  new: unknown;
}

export interface TimeTravelCauser {
  id: string | number;
  name?: string | null;
  email?: string | null;
}

export interface TimeTravelEvent {
  id: number | string;
  event: 'created' | 'updated' | 'deleted' | null;
  description: string;
  resource?: string | null;
  table?: string | null;
  recordId?: string | null;
  subjectType?: string | null;
  subjectId?: string | null;
  changes: TimeTravelChange[];
  occurredAt?: string | null;
  causer?: TimeTravelCauser | null;
}

export interface TimeTravelFilters {
  event?: string | null;
  resource?: string | null;
  search?: string | null;
  page?: number;
  per_page?: number;
}

export const useEmployeeTimeTravelStore = defineStore('employeeTimeTravel', {
  state: () => ({
    events: [] as TimeTravelEvent[],
    isLoading: false,
    error: null as string | null,
    page: 1,
    perPage: 50,
    lastPage: 1,
    total: 0,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchTimeline(employeeId: string, filters: TimeTravelFilters = {}) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        params.set('page', String(filters.page ?? this.page));
        params.set('per_page', String(filters.per_page ?? this.perPage));
        if (filters.event) params.set('event', filters.event);
        if (filters.resource) params.set('resource', filters.resource);
        if (filters.search) params.set('search', filters.search);

        const response = await fetch(
          `${API_URL}/employees/${employeeId}/time-travel?${params.toString()}`,
          { headers: this.buildHeaders() },
        );
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load time travel log');
        }

        const body = await response.json();
        this.events = body.data ?? [];
        this.page = body.current_page ?? 1;
        this.lastPage = body.last_page ?? 1;
        this.total = body.total ?? 0;
        this.perPage = body.per_page ?? this.perPage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load time travel log';
        this.events = [];
      } finally {
        this.isLoading = false;
      }
    },

    reset() {
      this.events = [];
      this.page = 1;
      this.lastPage = 1;
      this.total = 0;
      this.error = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeTimeTravelStore, import.meta.hot));
}
