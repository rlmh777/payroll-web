import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { EmployeeIncident, EmployeeIncidentPayload } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export const INCIDENT_TYPE_OPTIONS = [
  { label: 'Misconduct', value: 'MISCONDUCT' },
  { label: 'Attendance', value: 'ATTENDANCE' },
  { label: 'Safety', value: 'SAFETY' },
  { label: 'Performance', value: 'PERFORMANCE' },
  { label: 'Harassment', value: 'HARASSMENT' },
  { label: 'Accident', value: 'ACCIDENT' },
  { label: 'Policy violation', value: 'POLICY_VIOLATION' },
  { label: 'Other', value: 'OTHER' },
] as const;

export const INCIDENT_SEVERITY_OPTIONS = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'High', value: 'HIGH' },
  { label: 'Critical', value: 'CRITICAL' },
] as const;

export const INCIDENT_STATUS_OPTIONS = [
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Reported', value: 'REPORTED' },
  { label: 'Under review', value: 'UNDER_REVIEW' },
  { label: 'Action taken', value: 'ACTION_TAKEN' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Dismissed', value: 'DISMISSED' },
] as const;

export const INCIDENT_ACTION_OPTIONS = [
  { label: 'None', value: 'NONE' },
  { label: 'Verbal warning', value: 'VERBAL_WARNING' },
  { label: 'Written warning', value: 'WRITTEN_WARNING' },
  { label: 'Suspension', value: 'SUSPENSION' },
  { label: 'Training', value: 'TRAINING' },
  { label: 'Termination referral', value: 'TERMINATION_REFERRAL' },
  { label: 'Other', value: 'OTHER' },
] as const;

function humanizeCode(value?: string | null): string {
  if (!value) return '—';
  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatIncidentType(value?: string | null): string {
  return INCIDENT_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? humanizeCode(value);
}

export function formatIncidentSeverity(value?: string | null): string {
  return INCIDENT_SEVERITY_OPTIONS.find((o) => o.value === value)?.label ?? humanizeCode(value);
}

export function formatIncidentStatus(value?: string | null): string {
  return INCIDENT_STATUS_OPTIONS.find((o) => o.value === value)?.label ?? humanizeCode(value);
}

export function formatIncidentAction(value?: string | null): string {
  return INCIDENT_ACTION_OPTIONS.find((o) => o.value === value)?.label ?? humanizeCode(value);
}

export function incidentSeverityColor(value?: string | null): string {
  switch ((value || '').toUpperCase()) {
    case 'CRITICAL':
      return 'negative';
    case 'HIGH':
      return 'deep-orange';
    case 'MEDIUM':
      return 'warning';
    case 'LOW':
      return 'grey-7';
    default:
      return 'grey';
  }
}

export function incidentStatusColor(value?: string | null): string {
  switch ((value || '').toUpperCase()) {
    case 'CLOSED':
      return 'positive';
    case 'DISMISSED':
      return 'grey-7';
    case 'ACTION_TAKEN':
      return 'teal';
    case 'UNDER_REVIEW':
      return 'warning';
    case 'REPORTED':
      return 'primary';
    case 'DRAFT':
      return 'grey';
    default:
      return 'grey';
  }
}

export const useEmployeeIncidentStore = defineStore('employeeIncident', {
  state: () => ({
    records: [] as EmployeeIncident[],
    isLoading: false,
    recordToEdit: null as EmployeeIncident | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(includeJsonContentType = true): HeadersInit {
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

    extractErrorMessage(body: Record<string, unknown>, fallback: string): string {
      if (typeof body.message === 'string' && body.message) {
        return body.message;
      }
      const errors = body.errors as Record<string, string[] | string> | undefined;
      if (errors) {
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
          const first = errors[firstKey];
          if (Array.isArray(first) && first[0]) return first[0];
          if (typeof first === 'string') return first;
        }
      }
      return fallback;
    },

    buildRequestBody(
      payload: EmployeeIncidentPayload | Partial<EmployeeIncidentPayload>,
      attachments: File[] = [],
    ): { body: BodyInit; headers: HeadersInit } {
      if (attachments.length === 0) {
        return {
          body: JSON.stringify(payload),
          headers: this.buildHeaders(true),
        };
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined) return;
        if (value === null) {
          formData.append(key, '');
          return;
        }
        if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
          return;
        }
        formData.append(key, String(value));
      });
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });

      return {
        body: formData,
        headers: this.buildHeaders(false),
      };
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },

    setRecordToEdit(record: EmployeeIncident | null) {
      this.recordToEdit = record;
    },

    async fetchByEmployee(employeeId: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams({ employeeId, per_page: '100' });
        const response = await fetch(`${API_URL}/employee-incidents?${params}`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          throw new Error('Failed to load incidents');
        }
        const data = await response.json();
        this.records = data.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading incidents';
        this.records = [];
      } finally {
        this.isLoading = false;
      }
    },

    async createRecord(payload: EmployeeIncidentPayload, attachments: File[] = []) {
      const { body, headers } = this.buildRequestBody(payload, attachments);
      const response = await fetch(`${API_URL}/employee-incidents`, {
        method: 'POST',
        headers,
        body,
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(responseBody, 'Create failed'));
      }
      const data = await response.json();
      const created = (data.data ?? data) as EmployeeIncident;
      this.records = [created, ...this.records];
      return created;
    },

    async updateRecord(
      id: string,
      payload: Partial<EmployeeIncidentPayload>,
      attachments: File[] = [],
    ) {
      const { body, headers } = this.buildRequestBody(payload, attachments);
      const response = await fetch(`${API_URL}/employee-incidents/${id}`, {
        method: attachments.length > 0 ? 'POST' : 'PUT',
        headers,
        body,
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(responseBody, 'Update failed'));
      }
      const data = await response.json();
      const updated = (data.data ?? data) as EmployeeIncident;
      this.records = this.records.map((row) => (row.id === id ? updated : row));
      return updated;
    },

    async deleteRecord(id: string) {
      const response = await fetch(`${API_URL}/employee-incidents/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        throw new Error(this.extractErrorMessage(responseBody, 'Delete failed'));
      }
      this.records = this.records.filter((row) => row.id !== id);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeIncidentStore, import.meta.hot));
}
