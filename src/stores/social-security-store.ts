import { defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface SocialSecurity {
  id: string;
  weeklyEarningsStartRange: number;
  weeklyEarningsEndRange: number | null;
  weeklyInsurableEarnings: number;
  weeklyEmployeeContributions: number;
  weeklyEmployerContributions: number;
  weekyEmployeeContributionsRate: number;
  weeklyEmployerContributionsRate: number;
  maxWeeklyShortTermBenefit: number;
  maxWeeklyPensions: number;
  maxYearlyPension: number;
  state: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreateSocialSecurityBody {
  weeklyEarningsStartRange: number;
  weeklyEarningsEndRange: number | null;
  weeklyInsurableEarnings: number;
  weeklyEmployeeContributions: number;
  weeklyEmployerContributions: number;
  weekyEmployeeContributionsRate: number;
  weeklyEmployerContributionsRate: number;
  maxWeeklyShortTermBenefit: number;
  maxWeeklyPensions: number;
  maxYearlyPension: number;
  state?: 'active' | 'inactive';
}

interface UpdateSocialSecurityBody {
  weeklyEarningsStartRange?: number;
  weeklyEarningsEndRange?: number | null;
  weeklyInsurableEarnings?: number;
  weeklyEmployeeContributions?: number;
  weeklyEmployerContributions?: number;
  weekyEmployeeContributionsRate?: number;
  weeklyEmployerContributionsRate?: number;
  maxWeeklyShortTermBenefit?: number;
  maxWeeklyPensions?: number;
  maxYearlyPension?: number;
  state?: 'active' | 'inactive';
}

export const useSocialSecurityStore = defineStore('socialSecurity', {
  state: () => ({
    socialSecurities: [] as SocialSecurity[],
    isLoading: false,
    isLoadingSocialSecurities: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      state: null as 'active' | 'inactive' | null,
    },
  }),

  getters: {},

  actions: {
    async fetchSocialSecurities(page?: number, perPage?: number) {
      if (this.isLoadingSocialSecurities) return;

      this.isLoadingSocialSecurities = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.state !== null) {
          queryParams.append('state', this.searchFilters.state);
        }

        // Add pagination parameters
        const currentPage = page ?? this.currentPage;
        const itemsPerPage = perPage ?? 10;
        queryParams.append('page', currentPage.toString());
        queryParams.append('per_page', itemsPerPage.toString());

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/social-security?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch social security records: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.socialSecurities = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.socialSecurities = data;
        } else {
          this.socialSecurities = [];
        }
      } catch (error) {
        console.error('Error fetching social security records:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching social security records';
      } finally {
        this.isLoadingSocialSecurities = false;
      }
    },

    async createSocialSecurity(
      weeklyEarningsStartRange: number,
      weeklyEarningsEndRange: number | null,
      weeklyInsurableEarnings: number,
      weeklyEmployeeContributions: number,
      weeklyEmployerContributions: number,
      weekyEmployeeContributionsRate: number,
      weeklyEmployerContributionsRate: number,
      maxWeeklyShortTermBenefit: number,
      maxWeeklyPensions: number,
      maxYearlyPension: number,
      state?: 'active' | 'inactive'
    ): Promise<SocialSecurity | null> {
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

        const body: CreateSocialSecurityBody = {
          weeklyEarningsStartRange,
          weeklyEarningsEndRange,
          weeklyInsurableEarnings,
          weeklyEmployeeContributions,
          weeklyEmployerContributions,
          weekyEmployeeContributionsRate,
          weeklyEmployerContributionsRate,
          maxWeeklyShortTermBenefit,
          maxWeeklyPensions,
          maxYearlyPension,
        };

        if (state !== undefined) {
          body.state = state;
        }

        const response = await fetch(`${API_URL}/social-security`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create social security record: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const newRecord = result.data || result;

        // Add to list
        this.socialSecurities = [...this.socialSecurities, newRecord];

        return newRecord;
      } catch (error) {
        console.error('Error creating social security record:', error);
        this.error = error instanceof Error ? error.message : 'Error creating social security record';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSocialSecurity(
      id: string,
      weeklyEarningsStartRange?: number,
      weeklyEarningsEndRange?: number | null,
      weeklyInsurableEarnings?: number,
      weeklyEmployeeContributions?: number,
      weeklyEmployerContributions?: number,
      weekyEmployeeContributionsRate?: number,
      weeklyEmployerContributionsRate?: number,
      maxWeeklyShortTermBenefit?: number,
      maxWeeklyPensions?: number,
      maxYearlyPension?: number,
      state?: 'active' | 'inactive'
    ): Promise<SocialSecurity | null> {
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

        const body: UpdateSocialSecurityBody = {};

        if (weeklyEarningsStartRange !== undefined) {
          body.weeklyEarningsStartRange = weeklyEarningsStartRange;
        }
        if (weeklyEarningsEndRange !== undefined) {
          body.weeklyEarningsEndRange = weeklyEarningsEndRange;
        }
        if (weeklyInsurableEarnings !== undefined) {
          body.weeklyInsurableEarnings = weeklyInsurableEarnings;
        }
        if (weeklyEmployeeContributions !== undefined) {
          body.weeklyEmployeeContributions = weeklyEmployeeContributions;
        }
        if (weeklyEmployerContributions !== undefined) {
          body.weeklyEmployerContributions = weeklyEmployerContributions;
        }
        if (weekyEmployeeContributionsRate !== undefined) {
          body.weekyEmployeeContributionsRate = weekyEmployeeContributionsRate;
        }
        if (weeklyEmployerContributionsRate !== undefined) {
          body.weeklyEmployerContributionsRate = weeklyEmployerContributionsRate;
        }
        if (maxWeeklyShortTermBenefit !== undefined) {
          body.maxWeeklyShortTermBenefit = maxWeeklyShortTermBenefit;
        }
        if (maxWeeklyPensions !== undefined) {
          body.maxWeeklyPensions = maxWeeklyPensions;
        }
        if (maxYearlyPension !== undefined) {
          body.maxYearlyPension = maxYearlyPension;
        }
        if (state !== undefined) {
          body.state = state;
        }

        const response = await fetch(`${API_URL}/social-security/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to update social security record: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const updatedRecord = result.data || result;

        // Update in list
        const index = this.socialSecurities.findIndex((r) => r.id === id);
        if (index !== -1) {
          this.socialSecurities[index] = updatedRecord;
        }

        return updatedRecord;
      } catch (error) {
        console.error('Error updating social security record:', error);
        this.error = error instanceof Error ? error.message : 'Error updating social security record';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteSocialSecurity(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/social-security/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to delete social security record: ${response.statusText}`);
        }

        // Remove from list
        this.socialSecurities = this.socialSecurities.filter((r) => r.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting social security record:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting social security record';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

