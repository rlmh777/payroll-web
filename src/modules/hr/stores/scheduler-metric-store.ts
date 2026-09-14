import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type SchedulerMetricValueType = 'integer' | 'decimal';

export interface SchedulerMetricDefinition {
  id: number;
  code: string;
  name: string;
  short_label?: string | null;
  value_type: SchedulerMetricValueType;
  sort_order: number;
  is_active: boolean;
}

export type SchedulerDailyMetricValuesByDate = Record<string, Record<string, number | null>>;

export interface SchedulerMetricDefinitionPayload {
  code: string;
  name: string;
  short_label?: string | null;
  value_type: SchedulerMetricValueType;
  sort_order?: number;
  is_active?: boolean;
}

export const useSchedulerMetricStore = defineStore('schedulerMetric', {
  state: () => ({
    definitions: [] as SchedulerMetricDefinition[],
    activeDefinitions: [] as SchedulerMetricDefinition[],
    valuesByDate: {} as SchedulerDailyMetricValuesByDate,
    isLoadingDefinitions: false,
    isLoadingValues: false,
    isSaving: false,
    error: null as string | null,
  }),

  getters: {
    showMetricsRow(state): boolean {
      return state.activeDefinitions.length > 0;
    },
  },

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async parseError(response: Response): Promise<string> {
      const body = await response.json().catch(() => ({}));
      const validationMessage = body.errors
        ? Object.values(body.errors as Record<string, string[]>).flat().join(' ')
        : null;
      return validationMessage || body.message || `Request failed (${response.status})`;
    },

    async fetchDefinitions(options: { activeOnly?: boolean } = {}) {
      this.isLoadingDefinitions = true;
      this.error = null;

      try {
        const params = new URLSearchParams();
        if (options.activeOnly) {
          params.set('active_only', '1');
        }

        const query = params.toString();
        const response = await fetch(
          `${API_URL}/scheduler-metric-definitions${query ? `?${query}` : ''}`,
          { headers: this.buildHeaders() },
        );

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const payload = await response.json();
        const rows = Array.isArray(payload) ? payload : (payload.data ?? []);
        this.definitions = rows as SchedulerMetricDefinition[];
        return this.definitions;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load scheduler metrics';
        this.definitions = [];
        return [];
      } finally {
        this.isLoadingDefinitions = false;
      }
    },

    async createDefinition(payload: SchedulerMetricDefinitionPayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-metric-definitions`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        const created = body.data as SchedulerMetricDefinition;
        this.definitions = [...this.definitions, created].sort(
          (a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name),
        );
        return created;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create metric';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateDefinition(id: number, payload: SchedulerMetricDefinitionPayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-metric-definitions/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        const updated = body.data as SchedulerMetricDefinition;
        this.definitions = this.definitions
          .map((row) => (row.id === id ? updated : row))
          .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update metric';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteDefinition(id: number) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-metric-definitions/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        this.definitions = this.definitions.filter((row) => row.id !== id);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete metric';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async fetchDailyMetrics(start: string, end: string) {
      this.isLoadingValues = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ start, end });
        const response = await fetch(`${API_URL}/scheduler-daily-metrics?${params}`, {
          headers: this.buildHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        this.activeDefinitions = (body.definitions ?? []) as SchedulerMetricDefinition[];
        this.valuesByDate = (body.values_by_date ?? {}) as SchedulerDailyMetricValuesByDate;
        return body;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load daily metrics';
        this.activeDefinitions = [];
        this.valuesByDate = {};
        return null;
      } finally {
        this.isLoadingValues = false;
      }
    },

    async upsertDailyMetrics(date: string, values: Record<string, number | null>) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/scheduler-daily-metrics`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ date, values }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response));
        }

        const body = await response.json();
        this.valuesByDate = {
          ...this.valuesByDate,
          [date]: (body.values ?? {}) as Record<string, number | null>,
        };
        return body;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save daily metrics';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    metricLabel(definition: SchedulerMetricDefinition): string {
      return definition.short_label?.trim() || definition.name;
    },

    formatMetricValue(definition: SchedulerMetricDefinition, value: number | null | undefined): string {
      if (value == null || Number.isNaN(Number(value))) {
        return '—';
      }

      if (definition.value_type === 'integer') {
        return String(Math.round(Number(value)));
      }

      return Number(value).toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchedulerMetricStore, import.meta.hot));
}
