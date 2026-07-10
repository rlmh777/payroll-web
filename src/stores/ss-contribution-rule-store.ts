import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export type SsContributionMethod = 'NONE' | 'TIER_TABLE' | 'FIXED_WEEKLY' | 'RATE';

export interface ContributionRuleFormModel {
  id?: string;
  code: string;
  name: string;
  description: string;
  priority: number;
  employee_contribution_method: SsContributionMethod;
  employer_contribution_method: SsContributionMethod;
  employee_fixed_weekly_amount: number | null;
  employer_fixed_weekly_amount: number | null;
  employee_rate: number | null;
  employer_rate: number | null;
  skip_tier_lookup: boolean;
  conditionsJson: string;
  state: 'active' | 'inactive';
}

export interface SocialSecurityContributionRule {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  priority: number;
  employee_contribution_method: SsContributionMethod;
  employer_contribution_method: SsContributionMethod;
  employee_fixed_weekly_amount?: number | null;
  employer_fixed_weekly_amount?: number | null;
  employee_rate?: number | null;
  employer_rate?: number | null;
  skip_tier_lookup: boolean;
  conditions: Record<string, unknown>;
  effective_from?: string | null;
  effective_to?: string | null;
  state: 'active' | 'inactive';
}

export const useSsContributionRuleStore = defineStore('ssContributionRule', {
  state: () => ({
    rules: [] as SocialSecurityContributionRule[],
    isLoading: false,
    ruleToEdit: null as SocialSecurityContributionRule | null,
    isCreateOpen: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders() {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) headers['Authorization'] = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchRules() {
      this.isLoading = true;
      try {
        const response = await fetch(`${API_URL}/social-security-contribution-rules`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load contribution rules');
        this.rules = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading rules';
      } finally {
        this.isLoading = false;
      }
    },

    async createRule(payload: Partial<SocialSecurityContributionRule>) {
      const response = await fetch(`${API_URL}/social-security-contribution-rules`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || body.errors?.code?.[0] || 'Create failed');
      }
      await this.fetchRules();
    },

    async updateRule(id: string, payload: Partial<SocialSecurityContributionRule>) {
      const response = await fetch(`${API_URL}/social-security-contribution-rules/${id}`, {
        method: 'PUT',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Update failed');
      }
      await this.fetchRules();
    },

    async deleteRule(id: string) {
      const response = await fetch(`${API_URL}/social-security-contribution-rules/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Delete failed');
      }
      this.rules = this.rules.filter((r) => r.id !== id);
    },

    setRuleToEdit(rule: SocialSecurityContributionRule | null) {
      this.ruleToEdit = rule ? { ...rule } : null;
    },

    openCreateDialog() {
      this.isCreateOpen = true;
    },

    closeCreateDialog() {
      this.isCreateOpen = false;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSsContributionRuleStore, import.meta.hot));
}
