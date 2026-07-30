import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';
import { applyCompanyTheme, saveCompanyTheme } from '../utils/company-theme';

export interface Organization {
  id: number;
  legalName: string;
  alias?: string;
  email: string;
  phoneNumber1: string;
  phoneNumber2?: string;
  logoPath?: string | null;
  logoUrl?: string | null;
  street?: string;
  localityId?: string;
  socialSecurityNumber?: string;
  socialSecurityElectronicEmployerNumber?: string;
  bankBranchNumber?: string;
  taxIdentificationNumber?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

// --- Store Configuration ---

const API_URL =
  import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export const useOrganizationStore = defineStore('organization', {
  state: () => ({
    // Data and Pagination
    organizations: [] as Organization[],
    isLoading: false,
    isLoadingOrganization: false,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    search: '',
    error: null as string | null,
    organizationToEdit: null as Organization | null, // <- new
  }),

  // --- Actions ---
  actions: {
    /**
     * Fetches organization from the backend API using current state parameters (pagination, sort, search).
     */
    async fetchOrganizations(page?: number, perPage?: number) {
      if (this.isLoadingOrganization) return;
      this.isLoadingOrganization = true;
      this.error = null;

      try {
        const authStore = useAuthStore();

        // 1. Determine Pagination Parameters
        const currentPage = page ?? this.currentPage;
        // Default page size (e.g., 10) if not provided and state is missing
        const itemsPerPage = perPage ?? 20;

        // 2. Construct URL Query Parameters
        const queryParams = new URLSearchParams({
          page: String(currentPage),
          per_page: String(itemsPerPage),
        });

        if (this.search) queryParams.append('search', this.search);

        // 3. Setup Headers (including Authorization)
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const apiUrlWithParams = `${API_URL}/company?${queryParams}`;

        // 4. Perform Fetch Request
        const response = await fetch(apiUrlWithParams, {
          headers,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(
            errorBody.message || `Failed to fetch: ${response.status} ${response.statusText}`,
          );
        }

        const data = await response.json();

        this.organizations = data.data ?? [];
        this.organizationToEdit = data?.data[0] ?? null;
        this.currentPage = data.current_page ?? 1;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? 0;
        this.applyOrganizationTheme();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading organizations';
        return null;
      } finally {
        this.isLoadingOrganization = false;
      }
    },
    /**
     * Updates an existing country record via API.
     */
    async updateOrganization(
      id: number,
      payload: Partial<Organization>,
      logoFile: File | null = null,
      removeLogo = false,
    ) {
      this.isLoading = true;
      this.error = null;
      try {
        const authStore = useAuthStore();
        const editableFields = { ...payload };
        delete editableFields.id;
        delete editableFields.logoPath;
        delete editableFields.logoUrl;

        let method = 'PUT';
        let body: BodyInit;
        const headers: HeadersInit = {
          Authorization: `Bearer ${authStore.token}`,
        };

        if (logoFile || removeLogo) {
          const formData = new FormData();
          Object.entries(editableFields).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              formData.append(key, String(value));
            }
          });
          if (logoFile) {
            formData.append('logo', logoFile);
          }
          if (removeLogo) {
            formData.append('removeLogo', '1');
          }
          formData.append('_method', 'PUT');
          method = 'POST';
          body = formData;
        } else {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(editableFields);
        }

        const response = await fetch(`${API_URL}/company/${id}`, {
          method,
          headers,
          body,
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          const validationError = errorBody.error && typeof errorBody.error === 'object'
            ? Object.values(errorBody.error).flat()[0]
            : null;
          throw new Error(String(validationError || errorBody.message || 'Update failed.'));
        }

        // Refresh the list after successful update
        await this.fetchOrganizations();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error updating organization';
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    setOrganizationToEdit(organization: Organization | null) {
      this.organizationToEdit = organization ? { ...organization } : null;
    },
    applyOrganizationTheme() {
      const organization = this.organizationToEdit ?? this.organizations[0];
      if (!organization) {
        return;
      }

      const theme = applyCompanyTheme(organization.primaryColor, organization.secondaryColor);
      saveCompanyTheme(theme);
    },
  },
});

// HMR setup for development
if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrganizationStore, import.meta.hot));
}
