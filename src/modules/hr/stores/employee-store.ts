import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { Account, Allowance, CitizenshipStatus, Country, Employee, Gender, Honorific, LeaveType, Locality, PaymentMethod, PayrateFrequency } from '@core/types/models';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api'

let employeesFetchId = 0;

export type EmployeeDetailsTab =
  | 'allowances'
  | 'deductions'
  | 'historical-deductions'
  | 'ss-benefit'
  | 'contracts'
  | 'compensation'
  | 'documents'
  | 'incidents'
  | 'time-travel';

export const useEmployeeStore = defineStore('employee', {
  state: () => ({
    employees: [] as Employee[],
    genders: [] as Gender[],
    localities: [] as Locality[],
    nationalities: [] as Country[],
    citizenshipStatuses: [] as CitizenshipStatus[],
    honorifics: [] as Honorific[],
    leaveTypes: [] as LeaveType[],
    payrateFrequencies: [] as PayrateFrequency[],
    paymentMethods: [] as PaymentMethod[],
    accounts: [] as Account[],
    allowances: [] as Allowance[],
    searchName: '',
    filterEmployeeStatusIds: [] as number[],
    filterDepartmentId: null as number | null,
    sortBy: 'lastName',
    sortDirection: 'asc',
    perPage: 20,
    currentPage: 1,
    lastPage: 1,
    total: 0,
    isLoading: false,
    isLoadingEmployeeById: false,
    isLoadingGenders: false,
    isLoadingLocalities: false,
    isLoadingNationalities: false,
    isLoadingCitizenshipStatuses: false,
    isLoadingHonorifics: false,
    isLoadingLeaveTypes: false,
    isLoadingAccounts: false,
    isLoadingAllowances: false,
    isLoadingPayrateFrequencies: false,
    isLoadingPaymentMethods: false,
    hasMore: true,
    selectedEmployee: null as Employee | null,
    activeDetailsTab: 'allowances' as EmployeeDetailsTab,
  }),

  getters: {  },
  actions: {
    async fetchEmployees(reset: boolean = true) {
      const fetchId = ++employeesFetchId;
      this.isLoading = true;

      const pageToFetch = reset ? 1 : this.currentPage;

      if (reset) {
        this.currentPage = 1;
        this.employees = [];
        this.hasMore = true;
      }

      const queryParams = new URLSearchParams();
      if (this.searchName) queryParams.append('search', this.searchName);
      if (this.filterEmployeeStatusIds.length > 0) {
        this.filterEmployeeStatusIds.forEach((id) => {
          queryParams.append('employee_status_ids[]', String(id));
        });
      }
      if (this.filterDepartmentId != null) {
        queryParams.append('department_id', String(this.filterDepartmentId));
      }
      if (this.sortBy) queryParams.append('sort_by', this.sortBy);
      if (this.sortDirection) queryParams.append('sort_direction', this.sortDirection);
      if (this.perPage) queryParams.append('per_page', this.perPage.toString());
      queryParams.append('page', pageToFetch.toString());

      try {
        const response = await fetch(`${API_URL}/employees?${queryParams.toString()}`, {
          headers: {
            Accept: 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch employees: ${response.status}`);
        }

        const data = await response.json();

        if (fetchId !== employeesFetchId) {
          return;
        }

        const pageEmployees = Array.isArray(data.data) ? data.data : [];

        if (reset) {
          this.employees = pageEmployees;
        } else {
          this.employees = [...this.employees, ...pageEmployees];
        }

        this.currentPage = data.current_page ?? pageToFetch;
        this.lastPage = data.last_page ?? 1;
        this.total = data.total ?? this.employees.length;
        this.hasMore = this.currentPage < this.lastPage;
      } catch (error) {
        if (fetchId === employeesFetchId) {
          console.error('Error fetching employees:', error);
        }
      } finally {
        if (fetchId === employeesFetchId) {
          this.isLoading = false;
        }
      }
    },

    async ensureEmployeesLoaded(options?: { resetSearch?: boolean }) {
      if (options?.resetSearch) {
        this.searchName = '';
        this.filterEmployeeStatusIds = [];
        this.filterDepartmentId = null;
        await this.fetchEmployees(true);
        return;
      }

      const hasActiveFilters = Boolean(
        this.searchName
        || this.filterEmployeeStatusIds.length > 0
        || this.filterDepartmentId != null,
      );

      if (this.employees.length > 0 && !hasActiveFilters && !this.isLoading) {
        return;
      }

      await this.fetchEmployees(true);
    },
    
    async loadMoreEmployees() {
      if (!this.hasMore || this.isLoading) {
        return;
      }
      
      // Don't increment here, let fetchEmployees handle it
      const nextPage = this.currentPage + 1;
      this.currentPage = nextPage;
      await this.fetchEmployees(false);
    },
    
    resetEmployees() {
      employeesFetchId += 1;
      this.currentPage = 1;
      this.employees = [];
      this.hasMore = true;
      this.isLoading = false;
    },
    
    async fetchEmployeeById(id: string) {
      if (this.isLoadingEmployeeById) return;
      
      this.isLoadingEmployeeById = true;
      try {
        const response = await fetch(`${API_URL}/employees/${id}`, {
          headers: {
            Accept: 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch employee');
        }
        const data = await response.json();
        this.selectedEmployee = data;
        return data;
      } catch (error) {
        console.error('Error fetching employee:', error);
        throw error;
      } finally {
        this.isLoadingEmployeeById = false;
      }
    },

    async fetchGenders() {
      if (this.isLoadingGenders) return;
      
      this.isLoadingGenders = true;
      try {
        const response = await fetch(`${API_URL}/genders`);
        const data = await response.json();
        this.genders = data.data;
      } catch (error) {
        console.error('Error fetching genders:', error);
      } finally {
        this.isLoadingGenders = false;
      }
    },

    async fetchLocalities(search?: string, options?: { silent?: boolean }) {
      const silent = options?.silent === true;
      if (!silent) {
        this.isLoadingLocalities = true;
      }
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('per_page', '1000');
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/localities?${queryParams.toString()}`);
        const data = await response.json();
        this.localities = data.data ?? [];
        return this.localities;
      } catch (error) {
        console.error('Error fetching localities:', error);
        return [];
      } finally {
        if (!silent) {
          this.isLoadingLocalities = false;
        }
      }
    },

    async fetchNationalities(search?: string, options?: { silent?: boolean }) {
      const silent = options?.silent === true;
      if (!silent) {
        this.isLoadingNationalities = true;
      }
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('per_page', '1000');
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/countries?${queryParams.toString()}`);
        const data = await response.json();
        this.nationalities = data.data ?? [];
        return this.nationalities;
      } catch (error) {
        console.error('Error fetching nationalities:', error);
        return [];
      } finally {
        if (!silent) {
          this.isLoadingNationalities = false;
        }
      }
    },

    async fetchCitizenshipStatuses() {
      if (this.isLoadingCitizenshipStatuses) return;
      
      this.isLoadingCitizenshipStatuses = true;
      try {
        const response = await fetch(`${API_URL}/citizenship-statuses`);
        const data = await response.json();
        this.citizenshipStatuses = data.data;
      } catch (error) {
        console.error('Error fetching citizenship statuses:', error);
      } finally {
        this.isLoadingCitizenshipStatuses = false;
      }
    },

    async fetchHonorifics(search?: string, options?: { silent?: boolean }) {
      const silent = options?.silent === true;
      if (!silent) {
        this.isLoadingHonorifics = true;
      }
      try {
        const queryParams = new URLSearchParams();
        queryParams.append('per_page', '1000');
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/honorifics?${queryParams.toString()}`);
        const data = await response.json();
        this.honorifics = data.data ?? [];
        return this.honorifics;
      } catch (error) {
        console.error('Error fetching honorifics:', error);
        return [];
      } finally {
        if (!silent) {
          this.isLoadingHonorifics = false;
        }
      }
    },

    async fetchLeaveTypes(search?: string) {
      if (this.isLoadingLeaveTypes) return;
      
      this.isLoadingLeaveTypes = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        const response = await fetch(`${API_URL}/leave-types?${queryParams.toString()}`);
        const data = await response.json();
        this.leaveTypes = data.data;
      } catch (error) {
        console.error('Error fetching leave types:', error);
      } finally {
        this.isLoadingLeaveTypes = false;
      }
    },

    async fetchAccounts(search?: string) {
      this.isLoadingAccounts = true;
      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();
        if (search?.trim()) {
          queryParams.append('search', search.trim());
        }
        queryParams.append('per_page', '500');
        queryParams.append('with_relations', '1');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }
        const response = await fetch(`${API_URL}/accounts?${queryParams.toString()}`, { headers });
        if (!response.ok) {
          throw new Error('Failed to load accounts.');
        }
        const data = await response.json();
        this.accounts = data.data || data || [];
      } catch (error) {
        console.error('Error fetching accounts:', error);
      } finally {
        this.isLoadingAccounts = false;
      }
    },

    async fetchAllowances(search?: string) {
      if (this.isLoadingAllowances) return;
      
      this.isLoadingAllowances = true;
      try {
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }
        queryParams.append('per_page', '100'); // Get more allowances for select
        const response = await fetch(`${API_URL}/allowances?${queryParams.toString()}`);
        const data = await response.json();
        this.allowances = data.data || data;
      } catch (error) {
        console.error('Error fetching other payments:', error);
      } finally {
        this.isLoadingAllowances = false;
      }
    },

    async fetchPayrateFrequencies() {
      if (this.isLoadingPayrateFrequencies) return;
      
      this.isLoadingPayrateFrequencies = true;
      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        // Fetch from payrate-frequencies endpoint
        const queryParams = new URLSearchParams();
        queryParams.append('per_page', '100'); // Get all frequencies for select
        const response = await fetch(`${API_URL}/payrate-frequencies?${queryParams.toString()}`, { headers });
        if (response.ok) {
          const data = await response.json();
          // Handle paginated response
          this.payrateFrequencies = data.data || data;
        } else {
          throw new Error(`Failed to fetch payrate frequencies: ${response.statusText}`);
        }
      } catch (error) {
        console.error('Error fetching payrate frequencies:', error);
        this.payrateFrequencies = [];
      } finally {
        this.isLoadingPayrateFrequencies = false;
      }
    },

    async fetchPaymentMethods(search?: string) {
      if (this.isLoadingPaymentMethods) return;

      this.isLoadingPaymentMethods = true;
      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const queryParams = new URLSearchParams();
        queryParams.append('per_page', '100');
        if (search) {
          queryParams.append('search', search);
        }

        const response = await fetch(`${API_URL}/payment-methods?${queryParams.toString()}`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
        }

        const data = await response.json();
        this.paymentMethods = data.data || data;
      } catch (error) {
        console.error('Error fetching payment methods:', error);
        this.paymentMethods = [];
      } finally {
        this.isLoadingPaymentMethods = false;
      }
    },

    authHeaders(json = true): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};
      if (json) {
        headers['Content-Type'] = 'application/json';
      }
      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    parseApiError(body: Record<string, unknown>, fallback: string): Error {
      const errors = body.errors;
      if (errors && typeof errors === 'object') {
        const firstField = Object.values(errors as Record<string, unknown>)[0];
        if (Array.isArray(firstField) && firstField[0]) {
          return new Error(String(firstField[0]));
        }
      }
      return new Error(typeof body.message === 'string' ? body.message : fallback);
    },

    async createEmployee(payload: Partial<Employee>): Promise<Employee> {
      const response = await fetch(`${API_URL}/employees`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw this.parseApiError(body, 'Failed to create employee');
      }

      const data = await response.json();
      const created = (data.data ?? data) as Employee;
      this.selectedEmployee = created;
      this.employees.unshift(created);
      this.total += 1;

      return created;
    },

    async updateEmployee(id: string, payload: Partial<Employee>) {
      const response = await fetch(`${API_URL}/employees/${id}`, {
        method: 'PUT',
        headers: this.authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw this.parseApiError(body, 'Failed to update employee');
      }

      const data = await response.json();
      const updated = data.data ?? data;
      this.selectedEmployee = updated;

      const index = this.employees.findIndex((employee) => employee.id === id);
      if (index >= 0) {
        this.employees[index] = { ...this.employees[index], ...updated };
      }

      return updated;
    },

    async downloadEmployeeImportTemplate(): Promise<void> {
      const response = await fetch(`${API_URL}/employees/import/template`, {
        headers: this.authHeaders(false),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw this.parseApiError(body as Record<string, unknown>, 'Failed to download import template');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i);
      const filename = filenameMatch?.[1]
        ? decodeURIComponent(filenameMatch[1].replace(/"/g, ''))
        : 'employee-import-template.xlsx';

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },

    async importEmployees(payload: Record<string, unknown[]>) {
      const response = await fetch(`${API_URL}/employees/import`, {
        method: 'POST',
        headers: this.authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw this.parseApiError(body as Record<string, unknown>, 'Failed to import employees');
      }

      return response.json();
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeStore, import.meta.hot));
}
