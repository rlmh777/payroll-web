import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import type { CalendarEmployee } from './calendar-store';
import { normalizeCalendarEmployees } from '@hr/utils/calendar-employment-utils';
import { canViewAllSchedulerEmployees, isSchedulerSupervisor } from '@hr/utils/scheduler-access';
import type { SchedulerSortBy, SchedulerViewBy } from '@hr/utils/scheduler-utils';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

let employeesFetchId = 0;
let ensureEmployeesPromise: Promise<void> | null = null;

type SchedulerEmployeesMode = 'paginated' | 'subordinates' | 'self';

const DEFAULT_EMPLOYEES_PER_PAGE = 20;

export const useSchedulerStore = defineStore('scheduler', {
  state: () => ({
    viewBy: 'users' as SchedulerViewBy,
    sortBy: 'lastName' as SchedulerSortBy,
    filterDepartmentId: null as number | null,
    filterEmployeeId: null as string | null,
    hideUnscheduledUsers: false,
    employeeSearch: '',
    employees: [] as CalendarEmployee[],
    employeesCurrentPage: 1,
    employeesLastPage: 1,
    employeesTotal: 0,
    employeesPerPage: DEFAULT_EMPLOYEES_PER_PAGE,
    employeesHasMore: true,
    isLoadingEmployees: false,
    hasLoadedEmployees: false,
    employeesError: null as string | null,
    employeesMode: 'paginated' as SchedulerEmployeesMode,
  }),

  getters: {
    hasActiveFilters(state): boolean {
      return (
        state.filterDepartmentId != null ||
        state.filterEmployeeId != null ||
        state.hideUnscheduledUsers ||
        state.employeeSearch.trim().length > 0
      );
    },
  },

  actions: {
    setViewBy(value: SchedulerViewBy) {
      this.viewBy = value;
    },

    setSortBy(value: SchedulerSortBy) {
      this.sortBy = value;
    },

    setFilterDepartmentId(value: number | null) {
      this.filterDepartmentId = value;
    },

    setFilterEmployeeId(value: string | null) {
      this.filterEmployeeId = value;
    },

    setHideUnscheduledUsers(value: boolean) {
      this.hideUnscheduledUsers = value;
    },

    setEmployeeSearch(value: string) {
      this.employeeSearch = value;
    },

    clearFilters() {
      this.filterDepartmentId = null;
      this.filterEmployeeId = null;
      this.hideUnscheduledUsers = false;
      this.employeeSearch = '';
    },

    resetEmployees() {
      employeesFetchId += 1;
      ensureEmployeesPromise = null;
      this.employees = [];
      this.employeesCurrentPage = 1;
      this.employeesLastPage = 1;
      this.employeesTotal = 0;
      this.employeesHasMore = true;
      this.isLoadingEmployees = false;
      this.hasLoadedEmployees = false;
      this.employeesError = null;
      this.employeesMode = 'paginated';
    },

    async fetchEmployees(reset: boolean = true) {
      if (this.employeesMode !== 'paginated') {
        return;
      }

      const fetchId = ++employeesFetchId;
      this.isLoadingEmployees = true;
      this.employeesError = null;

      const pageToFetch = reset ? 1 : this.employeesCurrentPage;

      if (reset) {
        this.employeesCurrentPage = 1;
        this.employees = [];
        this.employeesHasMore = true;
      }

      const queryParams = new URLSearchParams({
        per_page: String(this.employeesPerPage),
        sort_by: this.sortBy,
        sort_direction: 'asc',
        page: String(pageToFetch),
      });

      const search = this.employeeSearch.trim();
      if (search) {
        queryParams.append('search', search);
      }

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/employees?${queryParams}`, { headers });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();

        if (fetchId !== employeesFetchId) {
          return;
        }

        const pageEmployees = normalizeCalendarEmployees(
          Array.isArray(data.data) ? data.data : [],
        );

        if (reset) {
          this.employees = pageEmployees;
        } else {
          this.employees = [...this.employees, ...pageEmployees];
        }

        this.employeesCurrentPage = data.current_page ?? pageToFetch;
        this.employeesLastPage = data.last_page ?? 1;
        this.employeesTotal = data.total ?? this.employees.length;
        this.employeesHasMore = this.employeesCurrentPage < this.employeesLastPage;
      } catch (error) {
        if (fetchId === employeesFetchId) {
          this.employeesError =
            error instanceof Error ? error.message : 'Error loading employees';
        }
      } finally {
        if (fetchId === employeesFetchId) {
          this.isLoadingEmployees = false;
        }
      }
    },

    async loadMoreEmployees() {
      if (
        this.employeesMode !== 'paginated' ||
        !this.employeesHasMore ||
        this.isLoadingEmployees
      ) {
        return;
      }

      this.employeesCurrentPage += 1;
      await this.fetchEmployees(false);
    },

    async fetchSubordinates(employeeId: string) {
      this.isLoadingEmployees = true;
      this.employeesError = null;
      this.employeesMode = 'subordinates';

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const search = this.employeeSearch.trim();
        const queryParams = new URLSearchParams();
        if (search) {
          queryParams.append('search', search);
        }

        const query = queryParams.toString();
        const response = await fetch(
          `${API_URL}/employees/${employeeId}/subordinates${query ? `?${query}` : ''}`,
          { headers },
        );

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          throw new Error(errorBody.message || `Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        this.employees = Array.isArray(data) ? normalizeCalendarEmployees(data) : [];
        this.employeesHasMore = false;
        this.employeesTotal = this.employees.length;
      } catch (error) {
        this.employeesError =
          error instanceof Error ? error.message : 'Error loading employees';
        this.employees = [];
        this.employeesHasMore = false;
      } finally {
        this.isLoadingEmployees = false;
      }
    },

    async ensureEmployeesLoaded(roleLabel: string, currentEmployee: CalendarEmployee | null) {
      const role = roleLabel.trim();
      if (!role) {
        return;
      }

      if (ensureEmployeesPromise) {
        return ensureEmployeesPromise;
      }

      ensureEmployeesPromise = this.resolveEmployees(role, currentEmployee)
        .then(() => {
          this.hasLoadedEmployees = true;
        })
        .finally(() => {
          ensureEmployeesPromise = null;
        });

      return ensureEmployeesPromise;
    },

    async resolveEmployees(role: string, currentEmployee: CalendarEmployee | null) {
      const normalizedRole = role.toLowerCase();

      if (canViewAllSchedulerEmployees(normalizedRole)) {
        this.employeesMode = 'paginated';
        this.employeesPerPage = DEFAULT_EMPLOYEES_PER_PAGE;
        await this.fetchEmployees(true);
        return;
      }

      if (isSchedulerSupervisor(normalizedRole)) {
        if (currentEmployee?.id) {
          await this.fetchSubordinates(currentEmployee.id);
          return;
        }

        this.employeesMode = 'paginated';
        this.employeesPerPage = DEFAULT_EMPLOYEES_PER_PAGE;
        await this.fetchEmployees(true);
        return;
      }

      this.employeesMode = 'self';
      this.employees = currentEmployee ? [currentEmployee] : [];
      this.employeesHasMore = false;
      this.employeesTotal = this.employees.length;
    },

    async reloadEmployeesForSearch(
      currentEmployee: CalendarEmployee | null,
      roleLabel: string,
    ) {
      const role = roleLabel.trim().toLowerCase();
      if (!role) {
        return;
      }

      if (canViewAllSchedulerEmployees(role)) {
        this.employeesMode = 'paginated';
        await this.fetchEmployees(true);
        return;
      }

      if (this.employeesMode === 'subordinates' && currentEmployee?.id) {
        await this.fetchSubordinates(currentEmployee.id);
        return;
      }

      if (this.employeesMode === 'paginated' || isSchedulerSupervisor(role)) {
        this.employeesMode = 'paginated';
        await this.fetchEmployees(true);
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSchedulerStore, import.meta.hot));
}
