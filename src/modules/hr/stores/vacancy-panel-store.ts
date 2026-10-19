import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { FormResponse, FormTemplate } from '@hr/stores/form-template-store';
import type { Vacancy, VacancyApplication } from '@hr/stores/vacancy-store';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface VacancyPanelMember {
  id: string;
  vacancy_id: string;
  name: string;
  email: string;
  member_type?: 'internal' | 'external';
  employee_id?: string | null;
  user_id?: string | null;
  status: string;
  recommended_application_id?: string | null;
  invited_at?: string | null;
  last_login_at?: string | null;
  invite_expires_at?: string | null;
}

export interface ScoreFieldTotal {
  id?: string | null;
  label: string;
  total: number;
  average: number | null;
  max?: number | null;
}

export interface InterviewCandidateSummary {
  application: VacancyApplication;
  summary: { count: number; average: number | null; total: number; max_score: number | null };
  field_totals: ScoreFieldTotal[];
  recommendations: number;
  scores: FormResponse[];
}

export interface InterviewSummary {
  form_template: FormTemplate | null;
  panel: VacancyPanelMember[];
  candidates: InterviewCandidateSummary[];
}

export interface PanelEmployeeOption {
  id: string;
  name: string;
  email: string;
  code?: string | null;
}

export interface PanelAssignment {
  panel_member: VacancyPanelMember;
  vacancy: Vacancy;
  form_template?: FormTemplate | null;
  applications: Array<VacancyApplication & { my_score?: FormResponse | null }>;
}

function authHeaders(): HeadersInit {
  const token = useAuthStore().token;
  return {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function parseError(response: Response, fallback: string): Promise<string> {
  const body = await response.json().catch(() => ({}));
  return (body as { message?: string }).message || fallback;
}

export const useVacancyPanelStore = defineStore('vacancyPanel', {
  state: () => ({
    members: [] as VacancyPanelMember[],
    assignments: [] as PanelAssignment[],
    scores: [] as FormResponse[],
    scoreSummary: { count: 0, average: null as number | null, total: 0, max_score: null as number | null },
    fieldTotals: [] as ScoreFieldTotal[],
    interview: null as InterviewSummary | null,
    isLoading: false,
    isSaving: false,
  }),
  actions: {
    async fetchMembers(vacancyId: string) {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/panel-members`, {
          headers: authHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load panel members.');
        }
        this.members = Array.isArray(body.data) ? body.data : [];
        return body.form_template as FormTemplate | null;
      } finally {
        this.isLoading = false;
      }
    },
    async invite(
      vacancyId: string,
      payload: {
        member_type: 'internal' | 'external';
        employee_id?: string | null;
        name?: string;
        email?: string;
      },
    ): Promise<VacancyPanelMember> {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/panel-members`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to invite panel member.');
        }
        this.members = [...this.members.filter((item) => item.id !== body.data.id), body.data];
        return body.data as VacancyPanelMember;
      } finally {
        this.isSaving = false;
      }
    },
    async resend(vacancyId: string, memberId: string) {
      const response = await fetch(`${API_URL}/vacancies/${vacancyId}/panel-members/${memberId}/resend`, {
        method: 'POST',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to resend invitation.'));
      }
    },
    async revoke(vacancyId: string, memberId: string) {
      const response = await fetch(`${API_URL}/vacancies/${vacancyId}/panel-members/${memberId}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(await parseError(response, 'Failed to remove panel member.'));
      }
      this.members = this.members.filter((item) => item.id !== memberId);
    },
    async fetchScores(vacancyId: string, applicationId: string) {
      const response = await fetch(`${API_URL}/vacancies/${vacancyId}/applications/${applicationId}/scores`, {
        headers: authHeaders(),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to load scores.');
      }
      this.scores = Array.isArray(body.data) ? body.data : [];
      this.scoreSummary = body.summary ?? { count: 0, average: null, total: 0, max_score: null };
      this.fieldTotals = Array.isArray(body.field_totals) ? body.field_totals : [];
      return body.form_template as FormTemplate | null;
    },
    async saveHrScore(
      vacancyId: string,
      applicationId: string,
      payload: { answers: Record<string, unknown>; comments?: string | null; submit?: boolean },
    ): Promise<FormResponse> {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/applications/${applicationId}/scores`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save score.');
        }
        return body.data as FormResponse;
      } finally {
        this.isSaving = false;
      }
    },
    async fetchInterview(vacancyId: string): Promise<InterviewSummary> {
      const response = await fetch(`${API_URL}/vacancies/${vacancyId}/interview`, {
        headers: authHeaders(),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to load the interview.');
      }
      const summary: InterviewSummary = {
        form_template: body.form_template ?? null,
        panel: Array.isArray(body.panel) ? body.panel : [],
        candidates: Array.isArray(body.candidates) ? body.candidates : [],
      };
      this.interview = summary;
      this.members = summary.panel;
      return summary;
    },
    async assignScoreSheet(vacancyId: string, formTemplateId: string): Promise<FormTemplate> {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/score-sheet`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ form_template_id: formTemplateId }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to assign the score sheet.');
        }
        return body.data as FormTemplate;
      } finally {
        this.isSaving = false;
      }
    },
    async searchEmployees(search: string): Promise<PanelEmployeeOption[]> {
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      const response = await fetch(`${API_URL}/vacancies/panel-employees?${params.toString()}`, {
        headers: authHeaders(),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to search employees.');
      }
      return Array.isArray(body.data) ? body.data : [];
    },
    async recommend(vacancyId: string, applicationId: string): Promise<VacancyPanelMember> {
      const response = await fetch(`${API_URL}/panel/vacancies/${vacancyId}/recommendation`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ application_id: applicationId }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to save the recommendation.');
      }
      return body.data as VacancyPanelMember;
    },
    async fetchAssignments() {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/panel/assignments`, { headers: authHeaders() });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load interview assignments.');
        }
        this.assignments = Array.isArray(body.data) ? body.data : [];
      } finally {
        this.isLoading = false;
      }
    },
    async fetchMyScore(vacancyId: string, applicationId: string) {
      const response = await fetch(
        `${API_URL}/panel/vacancies/${vacancyId}/applications/${applicationId}/score`,
        { headers: authHeaders() },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to load score sheet.');
      }
      return body as {
        vacancy: Vacancy;
        application: VacancyApplication;
        form_template: FormTemplate | null;
        data: FormResponse;
      };
    },
    async saveMyScore(
      vacancyId: string,
      applicationId: string,
      payload: { answers: Record<string, unknown>; comments?: string | null; submit?: boolean },
    ): Promise<FormResponse> {
      this.isSaving = true;
      try {
        const response = await fetch(
          `${API_URL}/panel/vacancies/${vacancyId}/applications/${applicationId}/score`,
          {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save score.');
        }
        return body.data as FormResponse;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVacancyPanelStore, import.meta.hot));
}
