import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

function appendApplicationPayload(body: FormData, payload: VacancyApplicationPayload) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    if (value instanceof File) {
      body.append(key, value);
      return;
    }
    body.append(key, String(value));
  });
}

export interface VacancyStage {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  lists_public: boolean;
  is_closed: boolean;
  vacancies?: Vacancy[];
}

export interface CandidateStage {
  id: number;
  name: string;
  color: string;
  sort_order: number;
  is_default: boolean;
  is_hired: boolean;
  is_rejected: boolean;
  applications?: VacancyApplication[];
}

export interface VacancyPerson {
  id: string;
  code?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
}

export interface VacancyAttachment {
  id: string;
  file_name: string;
  mime_type?: string | null;
  file_size?: number | null;
  file_url?: string | null;
}

export interface Vacancy {
  id: string;
  title: string;
  job_title_id: number | null;
  job_title?: { id: number; name: string; notes?: string | null; jobDescriptionUrl?: string | null } | null;
  worksite_id: number | null;
  worksite?: { id: number; name: string } | null;
  department_id: number | null;
  department?: { id: number; name: string } | null;
  hiring_manager_id?: string | null;
  hiring_manager?: VacancyPerson | null;
  positions: number;
  require_resume: boolean;
  description?: string | null;
  attachments?: VacancyAttachment[];
  advertise_internal: boolean;
  advertise_public: boolean;
  vacancy_stage_id: number;
  stage?: VacancyStage | null;
  sort_order: number;
  applications_count?: number;
  published_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface VacancyApplicant {
  id: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  name: string;
  email: string;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  locality_id?: string | null;
  locality?: { id: string; name: string } | null;
  birthdate?: string | null;
  gender_id?: number | null;
  gender?: { id: number; name: string } | null;
  social_security_number?: string | null;
  notes?: string | null;
  employee_id?: string | null;
}

export interface VacancyApplication {
  id: string;
  vacancy_id: string;
  vacancy_title?: string | null;
  vacancy?: {
    id: string;
    title: string;
    job_title?: string | null;
    worksite?: string | null;
    department?: string | null;
  } | null;
  applicant_id: string;
  applicant?: VacancyApplicant | null;
  candidate_stage_id?: number | null;
  candidate_stage?: CandidateStage | null;
  cover_letter?: string | null;
  cover_letter_name?: string | null;
  cover_letter_url?: string | null;
  resume_name?: string | null;
  resume_url?: string | null;
  social_security_name?: string | null;
  social_security_url?: string | null;
  passport_name?: string | null;
  passport_url?: string | null;
  police_record_name?: string | null;
  police_record_url?: string | null;
  source: string;
  status: string;
  sort_order?: number;
  converted_at?: string | null;
  created_at?: string | null;
  matching_employee?: VacancyPerson | null;
}

export interface VacancyApplicationPayload {
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  email: string;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  locality_id?: string | null;
  birthdate?: string | null;
  gender_id?: number | null;
  social_security_number?: string | null;
  cover_letter?: string | File | null;
  notes?: string | null;
  resume?: File | null;
  social_security?: File | null;
  passport?: File | null;
  police_record?: File | null;
}

export interface ConvertApplicantPayload {
  first_name?: string;
  middle_name?: string | null;
  last_name?: string;
  email?: string;
  phone?: string | null;
  address1?: string | null;
  address2?: string | null;
  locality_id?: string | null;
  birthdate?: string | null;
  gender_id?: number | null;
  social_security_number?: string | null;
  notes?: string | null;
  paymentMethodId?: number | null;
}

export interface VacancyPayload {
  title: string;
  job_title_id?: number | null;
  worksite_id?: number | null;
  department_id?: number | null;
  hiring_manager_id?: string | null;
  positions?: number;
  require_resume?: boolean;
  description?: string | null;
  advertise_internal?: boolean;
  advertise_public?: boolean;
  vacancy_stage_id?: number | null;
  remove_attachment_ids?: string[];
}

export interface VacancyStagePayload {
  name: string;
  color?: string;
  sort_order?: number;
  is_default?: boolean;
  lists_public?: boolean;
  is_closed?: boolean;
}

export interface CandidateStagePayload {
  name: string;
  color?: string;
  sort_order?: number;
  is_default?: boolean;
  is_hired?: boolean;
  is_rejected?: boolean;
}

export interface RecruitmentBoardFilters {
  search?: string | null;
  vacancy_id?: string | null;
  job_title_id?: number | null;
  department_id?: number | null;
  worksite_id?: number | null;
  hiring_manager_id?: string | null;
  advertising?: 'internal' | 'public' | null;
  source?: string | null;
  status?: string | null;
  published_from?: string | null;
  published_to?: string | null;
}

function toQuery(filters?: RecruitmentBoardFilters | null): string {
  if (!filters) {
    return '';
  }
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || value === false) {
      return;
    }
    if (key === 'advertising') {
      if (value === 'internal') {
        params.set('advertise_internal', '1');
      } else if (value === 'public') {
        params.set('advertise_public', '1');
      }
      return;
    }
    params.set(key, String(value));
  });
  const query = params.toString();
  return query ? `?${query}` : '';
}

function extractErrorMessage(body: Record<string, unknown>): string {
  const error = body.error;
  if (typeof error === 'string') return error;
  if (error && typeof error === 'object') {
    const firstField = Object.values(error)[0];
    if (Array.isArray(firstField) && firstField[0]) {
      return String(firstField[0]);
    }
  }
  if (body.errors && typeof body.errors === 'object') {
    const firstField = Object.values(body.errors as Record<string, unknown>)[0];
    if (Array.isArray(firstField) && firstField[0]) {
      return String(firstField[0]);
    }
  }
  return typeof body.message === 'string' ? body.message : 'Request failed.';
}

export const useVacancyStore = defineStore('vacancy', {
  state: () => ({
    stages: [] as VacancyStage[],
    candidateStages: [] as CandidateStage[],
    publicVacancies: [] as Vacancy[],
    selectedPublicVacancy: null as Vacancy | null,
    applications: [] as VacancyApplication[],
    selectedApplication: null as VacancyApplication | null,
    isLoadingBoard: false,
    isLoadingCandidateBoard: false,
    isLoadingStages: false,
    isLoadingCandidateStages: false,
    isLoadingPublic: false,
    isLoadingApplications: false,
    isSaving: false,
    error: null as string | null,
  }),

  getters: {
    defaultStage: (state) => state.stages.find((stage) => stage.is_default) ?? state.stages[0] ?? null,
    defaultCandidateStage: (state) =>
      state.candidateStages.find((stage) => stage.is_default) ?? state.candidateStages[0] ?? null,
    vacancyOptions: (state) => state.stages.flatMap((stage) => stage.vacancies ?? []),
  },

  actions: {
    buildHeaders(includeJson = true) {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        Accept: 'application/json',
      };
      if (includeJson) {
        headers['Content-Type'] = 'application/json';
      }
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchBoard(filters?: RecruitmentBoardFilters) {
      this.isLoadingBoard = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancies/board${toQuery(filters)}`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.stages = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load vacancies.';
        throw error;
      } finally {
        this.isLoadingBoard = false;
      }
    },

    async fetchStages() {
      this.isLoadingStages = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancy-stages`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.stages = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load vacancy stages.';
        throw error;
      } finally {
        this.isLoadingStages = false;
      }
    },

    async fetchCandidateBoard(filters?: RecruitmentBoardFilters) {
      this.isLoadingCandidateBoard = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancy-applications/board${toQuery(filters)}`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.candidateStages = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load candidates.';
        throw error;
      } finally {
        this.isLoadingCandidateBoard = false;
      }
    },

    async fetchCandidateStages() {
      this.isLoadingCandidateStages = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/candidate-stages`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.candidateStages = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load candidate stages.';
        throw error;
      } finally {
        this.isLoadingCandidateStages = false;
      }
    },

    async fetchPublicVacancies() {
      this.isLoadingPublic = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/careers/vacancies`);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.publicVacancies = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load jobs.';
        throw error;
      } finally {
        this.isLoadingPublic = false;
      }
    },

    async fetchPublicVacancy(id: string) {
      this.isLoadingPublic = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/careers/vacancies/${id}`);
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.selectedPublicVacancy = body as Vacancy;
        return this.selectedPublicVacancy;
      } catch (error) {
        this.selectedPublicVacancy = null;
        this.error = error instanceof Error ? error.message : 'Failed to load job.';
        throw error;
      } finally {
        this.isLoadingPublic = false;
      }
    },

    async submitPublicApplication(vacancyId: string, payload: VacancyApplicationPayload) {
      const body = new FormData();
      appendApplicationPayload(body, payload);

      const response = await fetch(`${API_URL}/careers/vacancies/${vacancyId}/applications`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(result));
      }
      return result.data as VacancyApplication;
    },

    async fetchApplications(vacancyId: string) {
      this.isLoadingApplications = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/applications`, {
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.applications = Array.isArray(body.data) ? body.data : [];
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load applications.';
        throw error;
      } finally {
        this.isLoadingApplications = false;
      }
    },

    async createApplication(vacancyId: string, payload: VacancyApplicationPayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const body = new FormData();
        appendApplicationPayload(body, payload);
        const response = await fetch(`${API_URL}/vacancies/${vacancyId}/applications`, {
          method: 'POST',
          headers: this.buildHeaders(false),
          body,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(result));
        }
        await this.fetchApplications(vacancyId);
        await this.fetchBoard();
        return result.data as VacancyApplication;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save application.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async convertApplication(vacancyId: string, applicationId: string, payload: ConvertApplicantPayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(
          `${API_URL}/vacancies/${vacancyId}/applications/${applicationId}/convert-to-employee`,
          {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify(payload),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        this.selectedApplication = body.application as VacancyApplication;
        await this.fetchApplications(vacancyId);
        await this.fetchBoard();
        return body as {
          action: 'created' | 'updated';
          application: VacancyApplication;
          employee: VacancyPerson;
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to convert applicant.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    buildVacancyRequest(
      payload: VacancyPayload | Partial<VacancyPayload>,
      attachments: File[] = [],
    ): { body: BodyInit; headers: HeadersInit; useMultipart: boolean } {
      const removeIds = payload.remove_attachment_ids ?? [];
      if (attachments.length === 0 && removeIds.length === 0) {
        return {
          body: JSON.stringify(payload),
          headers: this.buildHeaders(),
          useMultipart: false,
        };
      }

      const formData = new FormData();
      Object.entries(payload).forEach(([key, value]) => {
        if (value === undefined || key === 'remove_attachment_ids') {
          return;
        }
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
      removeIds.forEach((id) => {
        formData.append('remove_attachment_ids[]', id);
      });
      attachments.forEach((file) => {
        formData.append('attachments[]', file);
      });

      return {
        body: formData,
        headers: this.buildHeaders(false),
        useMultipart: true,
      };
    },

    async createVacancy(payload: VacancyPayload, attachments: File[] = []): Promise<Vacancy> {
      this.isSaving = true;
      this.error = null;
      try {
        const { body, headers } = this.buildVacancyRequest(payload, attachments);
        const response = await fetch(`${API_URL}/vacancies`, {
          method: 'POST',
          headers,
          body,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(result));
        }
        await this.fetchBoard();
        return result.data as Vacancy;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create vacancy.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateVacancy(
      id: string,
      payload: Partial<VacancyPayload>,
      attachments: File[] = [],
    ): Promise<Vacancy> {
      this.isSaving = true;
      this.error = null;
      try {
        const { body, headers, useMultipart } = this.buildVacancyRequest(payload, attachments);
        const response = await fetch(`${API_URL}/vacancies/${id}`, {
          method: useMultipart ? 'POST' : 'PUT',
          headers,
          body,
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(result));
        }
        await this.fetchBoard();
        return result.data as Vacancy;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update vacancy.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteVacancy(id: string) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancies/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchBoard();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete vacancy.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async moveVacancy(id: string, stageId: number, orderedIds: string[]) {
      const response = await fetch(`${API_URL}/vacancies/${id}/move`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          vacancy_stage_id: stageId,
          ordered_ids: orderedIds,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(body));
      }
      return body.data as Vacancy;
    },

    applyLocalMove(vacancyId: string, fromStageId: number, toStageId: number, toIndex: number) {
      const fromStage = this.stages.find((stage) => stage.id === fromStageId);
      const toStage = this.stages.find((stage) => stage.id === toStageId);
      if (!fromStage || !toStage) {
        return;
      }

      const fromCards = [...(fromStage.vacancies ?? [])];
      const cardIndex = fromCards.findIndex((card) => card.id === vacancyId);
      if (cardIndex < 0) {
        return;
      }
      const [card] = fromCards.splice(cardIndex, 1);
      if (!card) {
        return;
      }

      card.vacancy_stage_id = toStageId;
      card.stage = toStage;

      if (fromStageId === toStageId) {
        const boundedIndex = Math.max(0, Math.min(toIndex, fromCards.length));
        fromCards.splice(boundedIndex, 0, card);
        fromStage.vacancies = fromCards;
        return;
      }

      const toCards = [...(toStage.vacancies ?? [])];
      const boundedIndex = Math.max(0, Math.min(toIndex, toCards.length));
      toCards.splice(boundedIndex, 0, card);
      fromStage.vacancies = fromCards;
      toStage.vacancies = toCards;
    },

    applyLocalCandidateMove(applicationId: string, fromStageId: number, toStageId: number, toIndex: number) {
      const fromStage = this.candidateStages.find((stage) => stage.id === fromStageId);
      const toStage = this.candidateStages.find((stage) => stage.id === toStageId);
      if (!fromStage || !toStage) {
        return;
      }

      const fromCards = [...(fromStage.applications ?? [])];
      const cardIndex = fromCards.findIndex((card) => card.id === applicationId);
      if (cardIndex < 0) {
        return;
      }
      const [card] = fromCards.splice(cardIndex, 1);
      if (!card) {
        return;
      }

      card.candidate_stage_id = toStageId;
      card.candidate_stage = toStage;

      if (fromStageId === toStageId) {
        const boundedIndex = Math.max(0, Math.min(toIndex, fromCards.length));
        fromCards.splice(boundedIndex, 0, card);
        fromStage.applications = fromCards;
        return;
      }

      const toCards = [...(toStage.applications ?? [])];
      const boundedIndex = Math.max(0, Math.min(toIndex, toCards.length));
      toCards.splice(boundedIndex, 0, card);
      fromStage.applications = fromCards;
      toStage.applications = toCards;
    },

    async moveApplication(id: string, stageId: number, orderedIds: string[]) {
      const response = await fetch(`${API_URL}/vacancy-applications/${id}/move`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify({
          candidate_stage_id: stageId,
          ordered_ids: orderedIds,
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(body));
      }
      return body.data as VacancyApplication;
    },

    async persistColumnOrder(stageId: number) {
      const stage = this.stages.find((item) => item.id === stageId);
      const ids = (stage?.vacancies ?? []).map((card) => card.id);
      const firstId = ids[0];
      if (!firstId) {
        return;
      }
      await this.moveVacancy(firstId, stageId, ids);
    },

    async createStage(payload: VacancyStagePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancy-stages`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchStages();
        return body.data as VacancyStage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateStage(id: number, payload: VacancyStagePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancy-stages/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchStages();
        return body.data as VacancyStage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteStage(id: number) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/vacancy-stages/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchStages();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async reorderStages(ids: number[]) {
      const response = await fetch(`${API_URL}/vacancy-stages/reorder`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify({ ids }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(body));
      }
      this.stages = Array.isArray(body.data) ? body.data : this.stages;
    },

    async createCandidateStage(payload: CandidateStagePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/candidate-stages`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchCandidateStages();
        return body.data as CandidateStage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async updateCandidateStage(id: number, payload: CandidateStagePayload) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/candidate-stages/${id}`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchCandidateStages();
        return body.data as CandidateStage;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async deleteCandidateStage(id: number) {
      this.isSaving = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/candidate-stages/${id}`, {
          method: 'DELETE',
          headers: this.buildHeaders(),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(extractErrorMessage(body));
        }
        await this.fetchCandidateStages();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to delete stage.';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },

    async reorderCandidateStages(ids: number[]) {
      const response = await fetch(`${API_URL}/candidate-stages/reorder`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify({ ids }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(extractErrorMessage(body));
      }
      this.candidateStages = Array.isArray(body.data) ? body.data : this.candidateStages;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVacancyStore, import.meta.hot));
}
