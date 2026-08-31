import { defineStore, acceptHMRUpdate } from 'pinia';
import { date } from 'quasar';
import { useAttendanceStore, type TimesheetRow } from '@payroll/stores/attendance-store';
import { useSchedulerStore } from './scheduler-store';
import { useEmployeeGroupStore } from './employee-group-store';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';
import { getActiveEmploymentDetail } from '@hr/utils/calendar-employment-utils';
import { getDateRangeForView } from '@hr/utils/scheduler-utils';
import {
  DEFAULT_TIMESHEET_VISIBLE_COLUMNS,
  loadVisibleColumnNames,
  normalizeVisibleColumnNames,
  saveVisibleColumnNames,
  TIMESHEET_TABLE_COLUMNS,
} from '@hr/utils/timesheet-table-columns';

const initialWeekRange = getDateRangeForView('week', date.formatDate(new Date(), 'YYYY-MM-DD'));

export type TimesheetApprovalFilter = 'APPROVED' | 'PENDING' | null;

export interface TimesheetEmployeeGroup {
  key: string;
  employeeId: string;
  employmentDetailId: string | null;
  employmentContractLabel: string | null;
  employeeName: string | null;
  employeeCode: string | null;
  departmentId: number | null;
  departmentName: string | null;
  totalHours: number;
  rows: TimesheetRow[];
}

export const useTimesheetStore = defineStore('timesheetBrowse', {
  state: () => ({
    startDate: initialWeekRange.start,
    endDate: initialWeekRange.end,
    filterApprovalStatus: null as TimesheetApprovalFilter,
    visibleColumnNames: loadVisibleColumnNames(),
    employeePage: 1,
    employeesHasMore: true,
    isLoadingMoreEmployees: false,
  }),

  getters: {
    tableColumns(): typeof TIMESHEET_TABLE_COLUMNS {
      return TIMESHEET_TABLE_COLUMNS;
    },

    visibleTableColumns(): string[] {
      return normalizeVisibleColumnNames(this.visibleColumnNames);
    },

    hasActiveFilters(): boolean {
      const schedulerStore = useSchedulerStore();

      return (
        schedulerStore.filterDepartmentId != null ||
        schedulerStore.filterEmployeeGroupId != null ||
        schedulerStore.filterEmployeeId != null ||
        schedulerStore.employeeSearch.trim().length > 0 ||
        this.filterApprovalStatus != null
      );
    },

    activeFilters() {
      const schedulerStore = useSchedulerStore();
      const filters: {
        startDate?: string;
        endDate?: string;
        employeeId?: string;
        employeeIds?: string[];
        departmentId?: number;
        approvalStatus?: string;
      } = {
        startDate: this.startDate,
        endDate: this.endDate,
      };

      if (schedulerStore.filterEmployeeId) {
        filters.employeeId = schedulerStore.filterEmployeeId;
      }

      if (schedulerStore.filterDepartmentId != null) {
        filters.departmentId = schedulerStore.filterDepartmentId;
      }

      if (this.filterApprovalStatus) {
        filters.approvalStatus = this.filterApprovalStatus;
      }

      return filters;
    },

    groupedTimesheets(): TimesheetEmployeeGroup[] {
      const attendanceStore = useAttendanceStore();
      const schedulerStore = useSchedulerStore();
      const employeeGroupStore = useEmployeeGroupStore();
      const search = schedulerStore.employeeSearch.trim().toLowerCase();
      const groups = new Map<string, TimesheetEmployeeGroup>();

      const matchesEmployeeGroup = (employeeId: string) => {
        if (!schedulerStore.filterEmployeeGroupId) {
          return true;
        }

        const memberIds = employeeGroupStore.employeeIdsByGroupId.get(schedulerStore.filterEmployeeGroupId);
        return memberIds?.has(employeeId) ?? false;
      };

      for (const row of attendanceStore.timesheets) {
        if (search) {
          const haystack = `${row.employeeName ?? ''} ${row.employeeCode ?? ''}`.toLowerCase();
          if (!haystack.includes(search)) {
            continue;
          }
        }

        if (schedulerStore.filterDepartmentId != null) {
          const rowDepartmentId = row.departmentId == null ? null : Number(row.departmentId);
          if (rowDepartmentId !== schedulerStore.filterDepartmentId) {
            continue;
          }
        }

        if (!matchesEmployeeGroup(row.employeeId)) {
          continue;
        }

        if (schedulerStore.filterEmployeeId && row.employeeId !== schedulerStore.filterEmployeeId) {
          continue;
        }

        const groupKey = `${row.employeeId}:${row.employmentDetailId ?? 'none'}`;
        const existing = groups.get(groupKey);
        if (existing) {
          existing.rows.push(row);
          existing.totalHours += Number(row.hoursWorked || 0);
          continue;
        }

        groups.set(groupKey, {
          key: groupKey,
          employeeId: row.employeeId,
          employmentDetailId: row.employmentDetailId ?? null,
          employmentContractLabel: row.employmentContractLabel ?? null,
          employeeName: row.employeeName ?? null,
          employeeCode: row.employeeCode ?? null,
          departmentId: row.departmentId == null ? null : Number(row.departmentId),
          departmentName: row.departmentName ?? null,
          totalHours: Number(row.hoursWorked || 0),
          rows: [row],
        });
      }

      for (const employee of schedulerStore.employees) {
        if (search) {
          const haystack = `${employee.firstName ?? ''} ${employee.lastName ?? ''} ${employee.code ?? ''}`.toLowerCase();
          if (!haystack.includes(search)) {
            continue;
          }
        }

        if (schedulerStore.filterEmployeeId && employee.id !== schedulerStore.filterEmployeeId) {
          continue;
        }

        const activeEmployment = getActiveEmploymentDetail(employee);
        if (schedulerStore.filterDepartmentId != null) {
          const departmentId = activeEmployment?.departmentId ?? null;
          if (departmentId !== schedulerStore.filterDepartmentId) {
            continue;
          }
        }

        if (!matchesEmployeeGroup(employee.id)) {
          continue;
        }

        const employmentDetailId = activeEmployment?.id ?? null;
        const groupKey = `${employee.id}:${employmentDetailId ?? 'none'}`;
        if (groups.has(groupKey)) {
          continue;
        }

        const activeDetailRecord = employee.employmentDetails?.find(
          (detail) => detail.id === employmentDetailId,
        );

        groups.set(groupKey, {
          key: groupKey,
          employeeId: employee.id,
          employmentDetailId,
          employmentContractLabel: activeEmployment?.label ?? null,
          employeeName: `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || null,
          employeeCode: employee.code ?? null,
          departmentId: activeEmployment?.departmentId ?? null,
          departmentName: activeDetailRecord?.department?.name ?? null,
          totalHours: 0,
          rows: [],
        });
      }

      return Array.from(groups.values())
        .map((group) => ({
          ...group,
          rows: [...group.rows].sort((left, right) => {
            const dateCompare = left.date.localeCompare(right.date);
            if (dateCompare !== 0) {
              return dateCompare;
            }

            return (left.slotIndex ?? 0) - (right.slotIndex ?? 0);
          }),
          totalHours: Number(group.totalHours.toFixed(2)),
        }))
        .sort((left, right) => (left.employeeName || '').localeCompare(right.employeeName || ''));
    },
  },

  actions: {
    setDateRange(startDate: string, endDate: string) {
      this.startDate = startDate;
      this.endDate = endDate;
    },

    setFilterApprovalStatus(value: TimesheetApprovalFilter) {
      this.filterApprovalStatus = value;
    },

    clearFilters() {
      const schedulerStore = useSchedulerStore();
      schedulerStore.clearFilters();
      this.filterApprovalStatus = null;
    },

    setVisibleColumnNames(names: string[]) {
      this.visibleColumnNames = normalizeVisibleColumnNames(names);
      saveVisibleColumnNames(this.visibleColumnNames);
    },

    resetVisibleColumns() {
      this.setVisibleColumnNames([...DEFAULT_TIMESHEET_VISIBLE_COLUMNS]);
    },

    async fetchTimesheetRows(reset = true) {
      const attendanceStore = useAttendanceStore();
      const schedulerStore = useSchedulerStore();

      if (reset) {
        this.employeePage = 1;
        this.employeesHasMore = true;
      }

      if (schedulerStore.filterEmployeeId) {
        this.employeesHasMore = false;
        await attendanceStore.fetchTimesheets(this.activeFilters, 1, 500);
        return;
      }

      if (schedulerStore.employeesMode === 'self') {
        this.employeesHasMore = false;
        const employeeId = schedulerStore.employees[0]?.id;
        await attendanceStore.fetchTimesheets(
          {
            ...this.activeFilters,
            ...(employeeId ? { employeeId } : {}),
          },
          1,
          500,
        );
        return;
      }

      if (schedulerStore.employeesMode === 'subordinates') {
        this.employeesHasMore = false;
        const employeeIds = schedulerStore.employees.map((employee) => employee.id);
        await attendanceStore.fetchTimesheets(
          {
            ...this.activeFilters,
            ...(employeeIds.length ? { employeeIds } : {}),
          },
          1,
          500,
        );
        return;
      }

      const employeeIds = schedulerStore.employees.map((employee) => employee.id);

      if (employeeIds.length === 0) {
        attendanceStore.timesheets = [];
        this.employeesHasMore = schedulerStore.employeesHasMore;
        return;
      }

      await attendanceStore.fetchTimesheets(
        {
          ...this.activeFilters,
          employeeIds,
        },
        1,
        300,
        { append: false },
      );

      this.employeePage = 1;
      this.employeesHasMore = schedulerStore.employeesHasMore;
    },

    async loadMoreTimesheetEmployees() {
      if (
        this.isLoadingMoreEmployees ||
        !this.employeesHasMore ||
        !canViewAllSchedulerEmployees()
      ) {
        return;
      }

      const schedulerStore = useSchedulerStore();
      if (schedulerStore.employeesMode !== 'paginated' || !schedulerStore.employeesHasMore) {
        this.employeesHasMore = false;
        return;
      }

      this.isLoadingMoreEmployees = true;

      try {
        const newEmployees = await schedulerStore.loadMoreEmployees();
        const employeeIds = newEmployees.map((employee) => employee.id);

        if (employeeIds.length > 0) {
          const attendanceStore = useAttendanceStore();
          await attendanceStore.fetchTimesheets(
            {
              ...this.activeFilters,
              employeeIds,
            },
            1,
            300,
            { append: true },
          );
          this.employeePage += 1;
        }

        this.employeesHasMore = schedulerStore.employeesHasMore;
      } finally {
        this.isLoadingMoreEmployees = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useTimesheetStore, import.meta.hot));
}
