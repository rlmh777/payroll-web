import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type ScheduleComparisonSource = 'CLOCK' | 'ROUNDED';

export interface AttendanceSettings {
  clockRoundOffMinutes: number;
  scheduleComparisonSource: ScheduleComparisonSource;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function normalizeSettings(data: Partial<AttendanceSettings> | null | undefined): AttendanceSettings {
  const source = String(data?.scheduleComparisonSource ?? 'ROUNDED').toUpperCase();

  return {
    clockRoundOffMinutes: Number(data?.clockRoundOffMinutes ?? 30),
    scheduleComparisonSource: source === 'CLOCK' ? 'CLOCK' : 'ROUNDED',
  };
}

export const useAttendanceSettingStore = defineStore('attendanceSetting', {
  state: () => ({
    settings: null as AttendanceSettings | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  getters: {
    usesRoundedScheduleComparison(state): boolean {
      return (state.settings?.scheduleComparisonSource ?? 'ROUNDED') === 'ROUNDED';
    },
  },

  actions: {
    async fetchSettings() {
      if (this.isLoading) {
        return this.settings;
      }

      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/attendance-settings`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to load attendance settings (${response.status})`,
          );
        }

        const data = await response.json();
        this.settings = normalizeSettings(data);

        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load attendance settings';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(payload: AttendanceSettings) {
      this.isSaving = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/attendance-settings`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const validationMessage = errorBody.errors
            ? Object.values(errorBody.errors as Record<string, string[]>).flat().join(' ')
            : null;
          throw new Error(
            validationMessage || errorBody.message || `Failed to save attendance settings (${response.status})`,
          );
        }

        const data = await response.json();
        this.settings = normalizeSettings(data.data ?? payload);

        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save attendance settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAttendanceSettingStore, import.meta.hot));
}
