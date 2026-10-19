import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { FormResponse, FormTemplate } from '@hr/stores/form-template-store';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export interface AppraisalEmployee {
  id?: string | null;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
}

export interface AppraisalPipelineStep {
  id?: string;
  key?: string;
  label?: string;
  assigneeType?: string;
  domainStatus?: string | null;
  uiConfig?: Record<string, unknown>;
}

export interface AppraisalPipeline {
  id?: string;
  status?: string;
  currentStep?: AppraisalPipelineStep | null;
  template?: { name?: string; steps?: AppraisalPipelineStep[] } | null;
}

export interface EmployeeAppraisal {
  id: string;
  employee_id: string;
  employee?: AppraisalEmployee | null;
  period_label: string;
  period_start?: string | null;
  period_end?: string | null;
  status: string;
  form_template?: FormTemplate | null;
  form_response?: FormResponse | null;
  pipeline?: AppraisalPipeline | null;
  hr_renew_contract?: boolean | null;
  hr_increment_approved?: boolean | null;
  hr_increment_type?: 'percent' | 'amount' | null;
  hr_increment_value?: number | null;
  hr_notes?: string | null;
  accounts_notes?: string | null;
  next_appraisal_date?: string | null;
  can_act?: boolean;
  can_edit_form?: boolean;
  can_manage?: boolean;
  is_supervisor_step?: boolean;
  is_hr_step?: boolean;
  is_accounts_step?: boolean;
  submitted_at?: string | null;
  completed_at?: string | null;
}

export interface AppraisalOptions {
  form_templates: Array<{ id: string; name: string }>;
  pipeline_templates: Array<{ id: string; key: string; name: string }>;
}

export interface AppraisalCandidate {
  id: string;
  code?: string | null;
  name: string;
  appraisal_form?: { id: string; name: string } | null;
  appraisal_date?: string | null;
  contract_end_date?: string | null;
}

export interface StartAppraisalPayload {
  employee_id: string;
  period_label: string;
  period_start?: string | null;
  period_end?: string | null;
  form_template_id?: string | null;
  pipeline_template_id?: string | null;
}

export interface AppraisalActionPayload {
  action: 'approve' | 'reject' | 'return' | 'cancel';
  note?: string | null;
  hr_renew_contract?: boolean;
  hr_increment_approved?: boolean;
  hr_increment_type?: 'percent' | 'amount' | null;
  hr_increment_value?: number | null;
  hr_notes?: string | null;
  accounts_notes?: string | null;
  next_appraisal_date?: string | null;
  answers?: Record<string, unknown>;
  submit_form?: boolean;
}

function errorMessage(body: { message?: string; errors?: Record<string, string[]> }, fallback: string): string {
  const firstError = Object.values(body.errors ?? {})[0]?.[0];
  return firstError || body.message || fallback;
}

export const useAppraisalStore = defineStore('appraisal', {
  state: () => ({
    inbox: [] as EmployeeAppraisal[],
    items: [] as EmployeeAppraisal[],
    current: null as EmployeeAppraisal | null,
    options: null as AppraisalOptions | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json', Accept: 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchInbox() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/appraisals/inbox`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load pending appraisals'));
        }
        this.inbox = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load pending appraisals';
        this.inbox = [];
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAll() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/appraisals`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load appraisals'));
        }
        this.items = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load appraisals';
        this.items = [];
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchOptions() {
      const response = await fetch(`${API_URL}/appraisals/options`, { headers: this.buildHeaders() });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(errorMessage(body, 'Failed to load appraisal options'));
      }
      this.options = {
        form_templates: Array.isArray(body.form_templates) ? body.form_templates : [],
        pipeline_templates: Array.isArray(body.pipeline_templates) ? body.pipeline_templates : [],
      };
      return this.options;
    },

    async fetchCandidates() {
      const response = await fetch(`${API_URL}/appraisals/candidates`, { headers: this.buildHeaders() });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(errorMessage(body, 'Failed to load employees'));
      }
      const rows: AppraisalCandidate[] = Array.isArray(body.data) ? body.data : [];
      return rows;
    },

    async fetchContract(employeeId: string) {
      const response = await fetch(`${API_URL}/appraisals/contracts/${employeeId}`, { headers: this.buildHeaders() });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(errorMessage(body, 'Failed to load the contract appraisal form'));
      }
      const row: AppraisalCandidate = body.data;
      return row;
    },

    async fetchOne(id: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/appraisals/${id}`, { headers: this.buildHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to load appraisal'));
        }
        this.current = body.data as EmployeeAppraisal;
        return this.current;
      } catch (error) {
        this.current = null;
        this.error = error instanceof Error ? error.message : 'Failed to load appraisal';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },

    async start(payload: StartAppraisalPayload) {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/appraisals`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to start appraisal'));
        }
        return body.data as EmployeeAppraisal;
      } finally {
        this.isSaving = false;
      }
    },

    async saveForm(id: string, answers: Record<string, unknown>, submit = false) {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/appraisals/${id}/form`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify({ answers, submit }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to save appraisal form'));
        }
        this.current = body.data as EmployeeAppraisal;
        return this.current;
      } finally {
        this.isSaving = false;
      }
    },

    async act(id: string, payload: AppraisalActionPayload) {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/appraisals/${id}/actions`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(errorMessage(body, 'Failed to update appraisal'));
        }
        this.current = body.data as EmployeeAppraisal;
        return this.current;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAppraisalStore, import.meta.hot));
}
