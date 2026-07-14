import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { Vendor } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface ErrorWithData extends Error {
  errorData?: ApiErrorData;
}

interface CreateVendorBody {
  name: string;
  phone?: string | null;
  email?: string | null;
  bankId?: string | null;
  accountNumber?: string | null;
}

interface UpdateVendorBody {
  name?: string;
  phone?: string | null;
  email?: string | null;
  bankId?: string | null;
  accountNumber?: string | null;
}

export const useVendorStore = defineStore('vendor', {
  state: () => ({
    vendors: [] as Vendor[],
    isLoading: false,
    isLoadingVendors: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      bankId: null as string | null,
    },
  }),

  getters: {},

  actions: {
    async fetchVendors(page?: number, perPage?: number) {
      if (this.isLoadingVendors) return;

      this.isLoadingVendors = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        // Add search filters
        if (this.searchFilters.search) {
          queryParams.append('search', this.searchFilters.search);
        }
        if (this.searchFilters.bankId) {
          queryParams.append('bankId', this.searchFilters.bankId);
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

        const response = await fetch(`${API_URL}/vendors?${queryParams.toString()}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch vendors: ${response.statusText}`);
        }

        const data = await response.json();

        // Handle paginated response
        if (data.data && Array.isArray(data.data)) {
          this.vendors = data.data;
          this.currentPage = data.current_page || 1;
          this.lastPage = data.last_page || 1;
          this.total = data.total || 0;
        } else if (Array.isArray(data)) {
          // Fallback for non-paginated response
          this.vendors = data;
        } else {
          this.vendors = [];
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching vendors';
      } finally {
        this.isLoadingVendors = false;
      }
    },

    async createVendor(
      name: string,
      phone?: string | null,
      email?: string | null,
      bankId?: string | null,
      accountNumber?: string | null
    ): Promise<Vendor | null> {
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

        const body: CreateVendorBody = {
          name,
        };

        if (phone !== undefined && phone !== null) {
          body.phone = phone;
        }
        if (email !== undefined && email !== null) {
          body.email = email;
        }
        if (bankId !== undefined && bankId !== null) {
          body.bankId = bankId;
        }
        if (accountNumber !== undefined && accountNumber !== null) {
          body.accountNumber = accountNumber;
        }

        const response = await fetch(`${API_URL}/vendors`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to create vendor: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
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
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const newVendor = result.data || result;

        // Add to vendors list
        this.vendors = [...this.vendors, newVendor];

        return newVendor;
      } catch (error) {
        console.error('Error creating vendor:', error);
        this.error = error instanceof Error ? error.message : 'Error creating vendor';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateVendor(
      id: string,
      name?: string,
      phone?: string | null,
      email?: string | null,
      bankId?: string | null,
      accountNumber?: string | null
    ): Promise<Vendor | null> {
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

        const body: UpdateVendorBody = {};

        if (name !== undefined) {
          body.name = name;
        }
        if (phone !== undefined) {
          body.phone = phone;
        }
        if (email !== undefined) {
          body.email = email;
        }
        if (bankId !== undefined) {
          body.bankId = bankId;
        }
        if (accountNumber !== undefined) {
          body.accountNumber = accountNumber;
        }

        const response = await fetch(`${API_URL}/vendors/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          // Extract error message from errors object if present
          let errorMessage = errorData.error || `Failed to update vendor: ${response.statusText}`;
          if (errorData.errors) {
            // Get first error message from errors object
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
          const error = new Error(errorMessage) as ErrorWithData;
          error.errorData = errorData;
          throw error;
        }

        const result = await response.json();
        const updatedVendor = result.data || result;

        // Update in vendors list
        const index = this.vendors.findIndex((v) => v.id === id);
        if (index !== -1) {
          this.vendors[index] = updatedVendor;
        }

        return updatedVendor;
      } catch (error) {
        console.error('Error updating vendor:', error);
        this.error = error instanceof Error ? error.message : 'Error updating vendor';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteVendor(id: string): Promise<boolean> {
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

        const response = await fetch(`${API_URL}/vendors/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Failed to delete vendor: ${response.statusText}`);
        }

        // Remove from vendors list
        this.vendors = this.vendors.filter((v) => v.id !== id);

        return true;
      } catch (error) {
        console.error('Error deleting vendor:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting vendor';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useVendorStore, import.meta.hot));
}

