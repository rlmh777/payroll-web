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
  user_id?: string | null;
  status: string;
  invited_at?: string | null;
  last_login_at?: string | null;
  invite_expires_at?: string | null;
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
    scoreSummary: { count: 0, average: null as number | null, max_score: null as number | null },
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
    async invite(vacancyId: string, name: string, email: string): Promise<VacancyPanelMember> {
      this.isSaving = true;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/panel-members`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify({ name, email }),
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
      this.scoreSummary = body.summary ?? { count: 0, average: null, max_score: null };
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
