import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

export interface CalendarEntry {
  id: string;
  date: string;
  type: 'holiday' | 'vacation' | 'sick' | 'other';
  description: string;
  multiplier: string | number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const useCalendarStore = defineStore('calendar', {
  state: () => ({
    calendars: [] as CalendarEntry[],
    isLoading: false,
    isLoadingCalendars: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
  }),

  actions: {
    async fetchCalendars(params?: {
      start?: string;
      end?: string;
      page?: number;
      perPage?: number;
      search?: string;
    }) {
      if (this.isLoadingCalendars) return;
      this.isLoadingCalendars = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const currentPage = params?.page ?? this.currentPage;
        const itemsPerPage = params?.perPage ?? 50;
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        const searchValue = params?.search ?? this.search;
        if (searchValue) queryParams.append('search', searchValue);
        if (params?.start) queryParams.append('start', params.start);
        if (params?.end) queryParams.append('end', params.end);

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendars?${queryParams}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        this.calendars = data.data ?? [];
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading calendars';
      } finally {
        this.isLoadingCalendars = false;
      }
    },

    async createCalendar(payload: {
      date: string;
      description: string;
      type?: CalendarEntry['type'];
      multiplier?: number | string;
    }): Promise<CalendarEntry | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendars`, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to create calendar entry: ${response.statusText}`);
        }

        const result = await response.json();
        const newEntry = result.data || result;

        this.calendars = [newEntry, ...this.calendars];
        return newEntry;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error creating calendar entry';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteCalendar(id: string) {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/calendars/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete calendar entry: ${response.statusText}`);
        }

        this.calendars = this.calendars.filter((entry) => entry.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error deleting calendar entry';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCalendarStore, import.meta.hot));
}
