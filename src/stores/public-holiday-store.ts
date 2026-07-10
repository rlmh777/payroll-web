import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PublicHoliday {
  id: string;
  startDate: string;
  endDate: string;
  name: string;
  payMultiplier: string | number;
  isActive: boolean;
}

export interface PublicHolidayPayload {
  startDate: string;
  endDate: string;
  name: string;
  payMultiplier?: number;
  isActive?: boolean;
}

export const usePublicHolidayStore = defineStore('publicHoliday', {
  state: () => ({
    holidays: [] as PublicHoliday[],
    isLoading: false,
    error: null as string | null,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    recordToEdit: null as PublicHoliday | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchHolidays(params?: {
      page?: number;
      perPage?: number;
      search?: string;
      start?: string;
      end?: string;
      isActive?: boolean;
    }) {
      this.isLoading = true;
      this.error = null;

      try {
        const queryParams = new URLSearchParams({
          page: String(params?.page ?? this.currentPage),
          per_page: String(params?.perPage ?? 50),
          sort_by: 'startDate',
          sort_direction: 'asc',
        });

        const searchValue = params?.search ?? this.search;
        if (searchValue) queryParams.append('search', searchValue);
        if (params?.start) queryParams.append('start', params.start);
        if (params?.end) queryParams.append('end', params.end);
        if (params?.isActive === false) queryParams.append('is_active', '0');
        if (params?.isActive === true) queryParams.append('is_active', '1');

        const response = await fetch(`${API_URL}/public-holidays?${queryParams}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error('Failed to load public holidays');
        }

        const data = await response.json();
        this.holidays = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.holidays.length;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading holidays';
      } finally {
        this.isLoading = false;
      }
    },

    async createHoliday(payload: PublicHolidayPayload) {
      const response = await fetch(`${API_URL}/public-holidays`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractError(body) || 'Failed to create holiday');
      }

      return (await response.json()).data as PublicHoliday;
    },

    async updateHoliday(id: string, payload: Partial<PublicHolidayPayload>) {
      const response = await fetch(`${API_URL}/public-holidays/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractError(body) || 'Failed to update holiday');
      }

      return (await response.json()).data as PublicHoliday;
    },

    async deleteHoliday(id: string) {
      const response = await fetch(`${API_URL}/public-holidays/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(this.extractError(body) || 'Failed to delete holiday');
      }

      this.holidays = this.holidays.filter((holiday) => holiday.id !== id);
    },

    extractError(body: Record<string, unknown>): string | null {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const firstField = Object.values(errors)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return String(firstField[0]);
        }
      }

      return typeof body.message === 'string' ? body.message : null;
    },

    setRecordToEdit(record: PublicHoliday | null) {
      this.recordToEdit = record ? { ...record } : null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePublicHolidayStore, import.meta.hot));
}
