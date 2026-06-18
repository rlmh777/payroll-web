import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from './auth';
import type { ClockingImportPayloadRow } from 'src/utils/clocking-import-staging';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface ClockingLogRow {
  id: string;
  biometricUserId: string;
  deviceId: string | null;
  punchDateTime: string;
  punchType?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface TimesheetRow {
  id: string;
  employeeId: string;
  employeeCode?: string | null;
  employeeName?: string | null;
  date: string;
  clockInTime: string | null;
  clockInDeviceId: string | null;
  clockOutTime: string | null;
  clockOutDeviceId: string | null;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  unpaidHours: number;
  workingStatus: string;
  departmentId: number | null;
  departmentName: string | null;
  worksiteId: number | null;
  worksiteName: string | null;
  payType: string | null;
  hourlyRate: number | null;
  baseSalary: number | null;
  approvalStatus: string;
  approvedBy: string | null;
  approvedByName: string | null;
  approvedAt: string | null;
  remarks: string | null;
  hasIssues: boolean;
}

export interface EmployeeTimesheetSummary {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string | null;
  departmentId: number | string | null;
  departmentName: string | null;
  payType: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  workDays: number;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  unpaidHours: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  issueCount: number;
  approvalStatus: string;
}

export interface PaginationState {
  page: number;
  rowsPerPage: number;
  rowsNumber: number;
}

export interface TimesheetSummary {
  timesheetCount: number;
  employeeCount: number;
  pendingCount: number;
  approvedCount: number;
  issueCount: number;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  unpaidHours: number;
}

export interface ImportFailedRow {
  rowNumber: number | string;
  error: string;
}

export interface ImportClockingResult {
  totalUploaded: number;
  inserted: number;
  duplicatesSkipped: number;
  failedRows: ImportFailedRow[];
}

export interface ProcessWarningRow {
  employeeId: string;
  employeeName?: string | null;
  date: string;
  message: string;
}

export interface ProcessClockingResult {
  totalLogs: number;
  groupedDays: number;
  processedTimesheets: number;
  clockingTimesheets: number;
  scheduledTimesheets: number;
  regularHours: number;
  overtimeHours: number;
  unresolvedBiometricUsers: string[];
  warnings: ProcessWarningRow[];
  payPeriod: PayPeriodSchedule | null;
}

export interface PayPeriodSchedule {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
}

interface PayPeriodApiRow {
  id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  pay_date?: string | null;
}

type ClockingLogFilters = {
  startDate?: string | undefined;
  endDate?: string | undefined;
  biometricUserId?: string | undefined;
  deviceId?: string | undefined;
};

type TimesheetFilters = {
  startDate?: string | undefined;
  endDate?: string | undefined;
  employeeId?: string | undefined;
  approvalStatus?: string | undefined;
  workingStatus?: string | undefined;
  payType?: string | undefined;
  issuesOnly?: boolean | undefined;
};

export const useAttendanceStore = defineStore('attendance', {
  state: () => ({
    clockingLogs: [] as ClockingLogRow[],
    timesheets: [] as TimesheetRow[],
    employeeTimesheetSummaries: [] as EmployeeTimesheetSummary[],
    employeeTimesheetDetails: [] as TimesheetRow[],
    timesheetSummary: {
      timesheetCount: 0,
      employeeCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      issueCount: 0,
      hoursWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      holidayHours: 0,
      unpaidHours: 0,
    } as TimesheetSummary,
    clockingLogPagination: {
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
    } as PaginationState,
    timesheetPagination: {
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
    } as PaginationState,
    employeeSummaryPagination: {
      page: 1,
      rowsPerPage: 25,
      rowsNumber: 0,
    } as PaginationState,
    lastImportResult: null as ImportClockingResult | null,
    lastProcessResult: null as ProcessClockingResult | null,
    payPeriods: [] as PayPeriodSchedule[],
    isLoadingClockingLogs: false,
    isLoadingTimesheets: false,
    isLoadingEmployeeSummaries: false,
    isLoadingEmployeeDetails: false,
    isLoadingPayPeriods: false,
    isImportingFile: false,
    isProcessingLogs: false,
    isUpdatingApproval: false,
    error: null as string | null,
  }),

  actions: {
    buildJsonHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers['Authorization'] = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    async parseError(response: Response, fallback: string): Promise<string> {
      const body = await response.json().catch(() => ({}));
      if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
      }

      if (typeof body.error === 'string' && body.error.trim() !== '') {
        return body.error;
      }

      return fallback;
    },

    async fetchClockingLogs(
      filters: ClockingLogFilters = {},
      page = 1,
      rowsPerPage?: number,
    ) {
      this.isLoadingClockingLogs = true;
      this.error = null;

      try {
        const effectiveRowsPerPage = rowsPerPage ?? this.clockingLogPagination.rowsPerPage;
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(effectiveRowsPerPage),
        });

        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.biometricUserId) params.append('biometricUserId', filters.biometricUserId);
        if (filters.deviceId) params.append('deviceId', filters.deviceId);

        const response = await fetch(`${API_URL}/clocking-logs?${params.toString()}`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch clocking logs.'));
        }

        const payload = await response.json();
        this.clockingLogs = Array.isArray(payload.data) ? payload.data : [];
        this.clockingLogPagination = {
          page: payload.current_page ?? page,
          rowsPerPage: effectiveRowsPerPage,
          rowsNumber: payload.total ?? this.clockingLogs.length,
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch clocking logs.';
      } finally {
        this.isLoadingClockingLogs = false;
      }
    },

    async importClockingRows(logs: ClockingImportPayloadRow[]) {
      this.isImportingFile = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/clocking-logs`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify({ logs }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to import reviewed clocking records.'));
        }

        const payload = await response.json();
        this.lastImportResult = {
          totalUploaded: payload.totalUploaded ?? logs.length,
          inserted: payload.inserted ?? 0,
          duplicatesSkipped: payload.duplicatesSkipped ?? 0,
          failedRows: Array.isArray(payload.failedRows) ? payload.failedRows : [],
        };

        return payload;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to import reviewed clocking records.';
        return null;
      } finally {
        this.isImportingFile = false;
      }
    },

    async processClockingLogs(payload: {
      payPeriodScheduleId?: string | undefined;
      startDate?: string | undefined;
      endDate?: string | undefined;
      biometricUserId?: string | undefined;
      overtimeThresholdHours?: number | undefined;
      queue?: boolean | undefined;
    }) {
      this.isProcessingLogs = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/clocking-logs/process`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to process clocking logs.'));
        }

        const result = await response.json();

        if (!result.queued) {
          this.lastProcessResult = {
            totalLogs: result.totalLogs ?? 0,
            groupedDays: result.groupedDays ?? 0,
            processedTimesheets: result.processedTimesheets ?? 0,
            clockingTimesheets: result.clockingTimesheets ?? 0,
            scheduledTimesheets: result.scheduledTimesheets ?? 0,
            regularHours: result.regularHours ?? 0,
            overtimeHours: result.overtimeHours ?? 0,
            unresolvedBiometricUsers: Array.isArray(result.unresolvedBiometricUsers)
              ? result.unresolvedBiometricUsers
              : [],
            warnings: Array.isArray(result.warnings) ? result.warnings : [],
            payPeriod: result.payPeriod ?? null,
          };
        }

        return result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to process clocking logs.';
        return null;
      } finally {
        this.isProcessingLogs = false;
      }
    },

    async fetchPayPeriods() {
      this.isLoadingPayPeriods = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/pay-period-schedules?per_page=100`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch pay periods.'));
        }

        const payload = await response.json();
        const periods = (Array.isArray(payload.data) ? payload.data : []) as PayPeriodApiRow[];

        this.payPeriods = periods.map((period) => ({
          id: period.id ?? '',
          startDate: (period.start_date ?? '').slice(0, 10),
          endDate: (period.end_date ?? '').slice(0, 10),
          payDate: (period.pay_date ?? '').slice(0, 10),
        }));
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch pay periods.';
      } finally {
        this.isLoadingPayPeriods = false;
      }
    },

    async fetchTimesheets(
      filters: TimesheetFilters = {},
      page = 1,
      rowsPerPage?: number,
    ) {
      this.isLoadingTimesheets = true;
      this.error = null;

      try {
        const effectiveRowsPerPage = rowsPerPage ?? this.timesheetPagination.rowsPerPage;
        const params = new URLSearchParams({
          page: String(page),
          per_page: String(effectiveRowsPerPage),
        });

        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);
        if (filters.employeeId) params.append('employeeId', filters.employeeId);
        if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
        if (filters.workingStatus) params.append('workingStatus', filters.workingStatus);
        if (filters.payType) params.append('payType', filters.payType);
        if (filters.issuesOnly) params.append('issuesOnly', '1');

        const response = await fetch(`${API_URL}/timesheets?${params.toString()}`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch timesheets.'));
        }

        const payload = await response.json();
        this.timesheets = Array.isArray(payload.data) ? payload.data : [];
        this.timesheetSummary = {
          timesheetCount: payload.summary?.timesheetCount ?? 0,
          employeeCount: payload.summary?.employeeCount ?? 0,
          pendingCount: payload.summary?.pendingCount ?? 0,
          approvedCount: payload.summary?.approvedCount ?? 0,
          issueCount: payload.summary?.issueCount ?? 0,
          hoursWorked: payload.summary?.hoursWorked ?? 0,
          regularHours: payload.summary?.regularHours ?? 0,
          overtimeHours: payload.summary?.overtimeHours ?? 0,
          holidayHours: payload.summary?.holidayHours ?? 0,
          unpaidHours: payload.summary?.unpaidHours ?? 0,
        };
        this.timesheetPagination = {
          page: payload.current_page ?? page,
          rowsPerPage: effectiveRowsPerPage,
          rowsNumber: payload.total ?? this.timesheets.length,
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch timesheets.';
      } finally {
        this.isLoadingTimesheets = false;
      }
    },

    async fetchEmployeeTimesheetSummaries(
      filters: TimesheetFilters = {},
      page = 1,
      rowsPerPage?: number,
    ) {
      this.isLoadingEmployeeSummaries = true;
      this.error = null;

      try {
        const effectiveRowsPerPage = rowsPerPage ?? this.employeeSummaryPagination.rowsPerPage;
        const params = this.buildTimesheetParams(filters, page, effectiveRowsPerPage);
        const response = await fetch(`${API_URL}/timesheets/employee-summary?${params.toString()}`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch employee timesheet summaries.'));
        }

        const payload = await response.json();
        this.employeeTimesheetSummaries = Array.isArray(payload.data) ? payload.data : [];
        this.timesheetSummary = this.normalizeTimesheetSummary(payload.summary);
        this.employeeSummaryPagination = {
          page: payload.current_page ?? page,
          rowsPerPage: effectiveRowsPerPage,
          rowsNumber: payload.total ?? this.employeeTimesheetSummaries.length,
        };
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch employee timesheet summaries.';
      } finally {
        this.isLoadingEmployeeSummaries = false;
      }
    },

    async fetchEmployeeTimesheetDetails(employeeId: string, filters: TimesheetFilters = {}) {
      this.isLoadingEmployeeDetails = true;
      this.error = null;

      try {
        const params = this.buildTimesheetParams({ ...filters, employeeId }, 1, 500);
        const response = await fetch(`${API_URL}/timesheets?${params.toString()}`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch employee timesheet detail.'));
        }

        const payload = await response.json();
        this.employeeTimesheetDetails = Array.isArray(payload.data) ? payload.data : [];
        return this.employeeTimesheetDetails;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch employee timesheet detail.';
        this.employeeTimesheetDetails = [];
        return null;
      } finally {
        this.isLoadingEmployeeDetails = false;
      }
    },

    async updateTimesheetApproval(
      id: string,
      payload: { approvalStatus: 'APPROVED' | 'REJECTED'; remarks?: string | undefined },
    ) {
      this.isUpdatingApproval = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/${id}/approval`, {
          method: 'PATCH',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to update timesheet approval.'));
        }

        return await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update timesheet approval.';
        return null;
      } finally {
        this.isUpdatingApproval = false;
      }
    },

    async updateBulkTimesheetApproval(payload: {
      timesheetIds: string[];
      approvalStatus: 'APPROVED' | 'REJECTED';
      remarks?: string | undefined;
    }) {
      this.isUpdatingApproval = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/approval/bulk`, {
          method: 'PATCH',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to update timesheet approvals.'));
        }

        return await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update timesheet approvals.';
        return null;
      } finally {
        this.isUpdatingApproval = false;
      }
    },

    buildTimesheetParams(filters: TimesheetFilters, page: number, rowsPerPage: number) {
      const params = new URLSearchParams({
        page: String(page),
        per_page: String(rowsPerPage),
      });

      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      if (filters.approvalStatus) params.append('approvalStatus', filters.approvalStatus);
      if (filters.workingStatus) params.append('workingStatus', filters.workingStatus);
      if (filters.payType) params.append('payType', filters.payType);
      if (filters.issuesOnly) params.append('issuesOnly', '1');

      return params;
    },

    normalizeTimesheetSummary(summary?: Partial<TimesheetSummary>): TimesheetSummary {
      return {
        timesheetCount: summary?.timesheetCount ?? 0,
        employeeCount: summary?.employeeCount ?? 0,
        pendingCount: summary?.pendingCount ?? 0,
        approvedCount: summary?.approvedCount ?? 0,
        issueCount: summary?.issueCount ?? 0,
        hoursWorked: summary?.hoursWorked ?? 0,
        regularHours: summary?.regularHours ?? 0,
        overtimeHours: summary?.overtimeHours ?? 0,
        holidayHours: summary?.holidayHours ?? 0,
        unpaidHours: summary?.unpaidHours ?? 0,
      };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAttendanceStore, import.meta.hot));
}
