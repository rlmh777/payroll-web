import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export type ProfileChangeField = {
  field: string;
  label: string;
  current: string | null;
  proposed: string | null;
  currentLabel?: string | null;
  proposedLabel?: string | null;
};

export type ProfileChangePipelineStep = {
  id?: string;
  key?: string;
  label?: string;
  assigneeType?: string;
};

export type ProfileChangePipeline = {
  id?: string;
  status?: string;
  currentStep?: ProfileChangePipelineStep | null;
  template?: { name?: string; steps?: ProfileChangePipelineStep[] } | null;
};

export type EmployeeProfileChange = {
  id: string;
  employee_id: string;
  employee?: {
    id?: string | null;
    code?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
  } | null;
  status: string;
  current_values?: Record<string, string | null>;
  proposed_values?: Record<string, string | null>;
  changes?: ProfileChangeField[];
  reviewer_notes?: string | null;
  pipeline?: ProfileChangePipeline | null;
  can_act?: boolean;
  can_cancel?: boolean;
  can_manage?: boolean;
  submitted_at?: string | null;
  completed_at?: string | null;
  applied_at?: string | null;
};

export type ProfileChangePayload = {
  address1?: string | null;
  address2?: string | null;
  localityId?: string | null;
  phone?: string | null;
  email?: string | null;
};

function errorMessage(body: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
  const firstError = Object.values(body.errors ?? {})[0]?.[0];
  return firstError || body.message || fallback;
}

export const useProfileChangeStore = defineStore('profileChange', {
  state: () => ({
    inbox: [] as EmployeeProfileChange[],
    items: [] as EmployeeProfileChange[],
    current: null as EmployeeProfileChange | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchInbox() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-profile-changes/inbox`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load profile change reviews'));
        }
        this.inbox = body.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load profile change reviews';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAll() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-profile-changes`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load profile changes'));
        }
        this.items = body.data ?? [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load profile changes';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchOne(id: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-profile-changes/${id}`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load profile change'));
        }
        this.current = body.data ?? null;
        return this.current;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load profile change';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async submit(payload: ProfileChangePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-profile-changes`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to submit profile change'));
        }
        this.current = body.data ?? null;
        return this.current;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to submit profile change';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async act(id: string, action: 'approve' | 'reject' | 'return' | 'cancel', note?: string | null) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/employee-profile-changes/${id}/actions`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ action, note: note || null }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to update profile change'));
        }
        this.current = body.data ?? null;
        return this.current;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update profile change';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileChangeStore, import.meta.hot));
}
