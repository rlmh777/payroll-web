import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface PayPeriodGroup {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  isDefault: boolean;
  rules?: string | null;
  payPeriodSchedules?: unknown[];
  created_at?: string;
  updated_at?: string;
}

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreatePayPeriodGroupBody {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  isDefault?: boolean;
  rules?: string | null;
}

interface UpdatePayPeriodGroupBody {
  name?: string;
  status?: 'active' | 'inactive';
  isDefault?: boolean;
  rules?: string | null;
}

export const usePayPeriodGroupStore = defineStore('payPeriodGroup', {
  state: () => ({
    payPeriodGroups: [] as PayPeriodGroup[],
    isLoading: false,
    isLoadingPayPeriodGroups: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      status: null as 'active' | 'inactive' | null,
    },
  }),

  getters: {},

  actions: {
    async fetchPayPeriodGroups(page?: number, perPage?: number) {
      if (this.isLoadingPayPeriodGroups) return;

      this.isLoadingPayPeriodGroups = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.status) {
          queryParams.append('status', this.searchFilters.status);
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

        const response = await fetch(`${API_URL}/pay-period-groups?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch pay period groups: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.payPeriodGroups = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.payPeriodGroups = data;
        } else {
          this.payPeriodGroups = [];
        }
      } catch (error) {
        console.error('Error fetching pay period groups:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching pay period groups';
      } finally {
        this.isLoadingPayPeriodGroups = false;
      }
    },

    async createPayPeriodGroup(
      id: string,
      name: string,
      status: 'active' | 'inactive',
      isDefault?: boolean,
      rules?: string | null
    ): Promise<PayPeriodGroup | null> {
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

        const body: CreatePayPeriodGroupBody = {
          id,
          name,
          status,
        };

        if (isDefault !== undefined) {
          body.isDefault = isDefault;
        }
        if (rules !== undefined) {
          body.rules = rules;
        }

        const response = await fetch(`${API_URL}/pay-period-groups`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create pay period group: ${response.statusText}`;
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
        const newGroup = result.data || result;

        // Add to list
        this.payPeriodGroups = [...this.payPeriodGroups, newGroup];

        return newGroup;
      } catch (error) {
        console.error('Error creating pay period group:', error);
        this.error = error instanceof Error ? error.message : 'Error creating pay period group';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updatePayPeriodGroup(
      id: string,
      name?: string,
      status?: 'active' | 'inactive',
      isDefault?: boolean,
      rules?: string | null
    ): Promise<PayPeriodGroup | null> {
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

        const body: UpdatePayPeriodGroupBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (status !== undefined) {
          body.status = status;
        }
        if (isDefault !== undefined) {
          body.isDefault = isDefault;
        }
        if (rules !== undefined) {
          body.rules = rules;
        }

        const response = await fetch(`${API_URL}/pay-period-groups/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to update pay period group: ${response.statusText}`;
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
        const updatedGroup = result.data || result;

        // Update in list
        const index = this.payPeriodGroups.findIndex((g) => g.id === id);
        if (index !== -1) {
          this.payPeriodGroups[index] = updatedGroup;
        }

        return updatedGroup;
      } catch (error) {
        console.error('Error updating pay period group:', error);
        this.error = error instanceof Error ? error.message : 'Error updating pay period group';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deletePayPeriodGroup(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/pay-period-groups/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to delete pay period group: ${response.statusText}`);
        }

        // Remove from list
        this.payPeriodGroups = this.payPeriodGroups.filter((g) => g.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting pay period group:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting pay period group';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePayPeriodGroupStore, import.meta.hot));
}
