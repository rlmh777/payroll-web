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
  employmentDetailId?: string | null;
  employmentContractLabel?: string | null;
  employeeCompensationId?: string | null;
  compensationLabel?: string | null;
  slotIndex?: number;
  employeeCode?: string | null;
  employeeName?: string | null;
  date: string;
  clockInTime: string | null;
  clockInDeviceId: string | null;
  clockOutTime: string | null;
  clockOutDeviceId: string | null;
  roundOffClockInTime: string | null;
  roundOffClockOutTime: string | null;
  clockedHoursWorked: number;
  includeLunchHour?: boolean;
  lunchHourHours: number;
  hoursWorked: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  unpaidHours: number;
  isPaid: boolean;
  paidHours: number;
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
  hasLeaveConflict?: boolean;
  isOutsideSchedule?: boolean;
  isLocked?: boolean;
  isPayDatePassed?: boolean;
  isDateUnlocked?: boolean;
  lockReason?: string | null;
  payDate?: string | null;
}

export interface EmployeeTimesheetSummary {
  employeeId: string;
  employmentDetailId?: string | null;
  employmentContractLabel?: string | null;
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
  paidHours: number;
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
  paidHours: number;
}

export interface TimesheetCompensationRecalculationResult {
  message: string;
  recalculatedTimesheets: number;
  recalculatedWeeks: number;
  startDate: string;
  endDate: string | null;
}

export interface PayrollAllowanceDeductionImportRow {
  employeeIdentifier: string;
  employeeName?: string | null;
  code: string;
  accountId?: string | null;
  date: string;
  quantity: number;
  rate?: number | null;
  amount: number;
}

export interface PayrollAllowanceDeductionImportDetail {
  rowNumber: number;
  kind: 'allowance' | 'deduction';
  code: string;
  date: string;
  quantity: number;
  rate: number;
  amount: number;
  accountId: string | null;
  accountName: string | null;
  errors: string[];
}

export interface PayrollAllowanceDeductionImportEmployee {
  employeeId: string | null;
  employeeIdentifier: string;
  employeeName: string | null;
  allowanceTotal: number;
  deductionTotal: number;
  recordCount: number;
  errorCount: number;
  details: PayrollAllowanceDeductionImportDetail[];
}

export interface PayrollAllowanceDeductionImportPreview {
  payrollRunId: string;
  recordCount: number;
  employeeCount: number;
  errorCount: number;
  allowanceTotal: number;
  deductionTotal: number;
  employees: PayrollAllowanceDeductionImportEmployee[];
  inserted?: {
    allowances: number;
    deductions: number;
    total: number;
  };
}

export interface PayrollRunEmployeeSummaryRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string | null;
  baseEarnings: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  grossPay: number;
  taxableGross: number;
  allowances: number;
  deductions: number;
  employerSocialSecurity: number;
  employeeSocialSecurity: number;
  incomeTax: number;
  overtimeHours: number;
  holidayHours: number;
  ytdEarnings: number;
  ytdIncomeTax: number;
  ytdSocialSecurity: number;
  netPay: number;
  mondaysInPeriod?: number;
  employeeBankId?: string | null;
  bankId?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  paymentReady?: boolean;
}

export interface PayrollRunEmployeeSummaryTotals {
  baseEarnings: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  grossPay: number;
  taxableGross: number;
  allowances: number;
  deductions: number;
  employerSocialSecurity: number;
  employeeSocialSecurity: number;
  incomeTax: number;
  overtimeHours: number;
  holidayHours: number;
  ytdEarnings: number;
  ytdIncomeTax: number;
  ytdSocialSecurity: number;
  netPay: number;
}

export interface PayrollRunEmployeeSummary {
  payrollRunId: string;
  asOfDate: string;
  rows: PayrollRunEmployeeSummaryRow[];
  totals: PayrollRunEmployeeSummaryTotals;
}

export type PayslipSort = 'last_name' | 'department_last_name';

export interface PayrollRunProcessResult {
  payrollRunId: string;
  status: string;
  employeeCount: number;
  asOfDate: string;
  totals: PayrollRunEmployeeSummaryTotals;
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
  timesheetProcessingQueued?: boolean;
}

export interface PayPeriodSchedule {
  id: string;
  startDate: string;
  endDate: string;
  payDate: string;
  payPeriodGroupId?: string | null;
  payPeriodGroupName?: string | null;
  payrollRunId?: string | null;
  payrollRunStatus?: string | null;
}

interface PayPeriodApiRow {
  id?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  pay_date?: string | null;
  pay_period_group_id?: string | null;
  payPeriodGroupId?: string | null;
  pay_period_group?: { id?: string | null; name?: string | null } | null;
  payPeriodGroup?: { id?: string | null; name?: string | null } | null;
}

export interface PayrollRun {
  id: string;
  payPeriodScheduleId: string;
  status: string;
  payPeriodSchedule: PayPeriodSchedule | null;
}

type PayrollRunApiRow = {
  id?: string | null;
  pay_period_schedule_id?: string | null;
  status?: string | null;
  pay_period_schedule?: PayPeriodApiRow | null;
  payPeriodSchedule?: PayPeriodApiRow | null;
};

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
  employmentDetailId?: string | undefined;
  payPeriodGroupId?: string | undefined;
  departmentId?: string | number | undefined;
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
      paidHours: 0,
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
      rowsPerPage: 100,
      rowsNumber: 0,
    } as PaginationState,
    lastImportResult: null as ImportClockingResult | null,
    payPeriods: [] as PayPeriodSchedule[],
    payrollRuns: [] as PayrollRun[],
    payrollRunEmployeeSummary: null as PayrollRunEmployeeSummary | null,
    isLoadingClockingLogs: false,
    isLoadingTimesheets: false,
    isLoadingEmployeeSummaries: false,
    isLoadingEmployeeDetails: false,
    isLoadingPayPeriods: false,
    isLoadingPayrollRuns: false,
    isLoadingPayrollRunSummary: false,
    isProcessingPayrollRun: false,
    isGeneratingPayslips: false,
    isImportingFile: false,
    isUpdatingApproval: false,
    isUpdatingRoundOff: false,
    isRecalculatingCompensation: false,
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

    buildAuthHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};

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

    mergeAffectedTimesheets(rows: TimesheetRow[]) {
      for (const updated of rows) {
        const index = this.timesheets.findIndex((row) => row.id === updated.id);
        if (index >= 0) {
          this.timesheets[index] = updated;
        }

        const detailIndex = this.employeeTimesheetDetails.findIndex((row) => row.id === updated.id);
        if (detailIndex >= 0) {
          this.employeeTimesheetDetails[detailIndex] = updated;
        }
      }
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
          timesheetProcessingQueued: Boolean(payload.timesheetProcessingQueued),
        };

        return payload;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to import reviewed clocking records.';
        return null;
      } finally {
        this.isImportingFile = false;
      }
    },

    async previewAllowanceDeductionImport(payrollRunId: string, rows: PayrollAllowanceDeductionImportRow[]) {
      this.isImportingFile = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs/${payrollRunId}/allowance-deduction-import/preview`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify({ rows }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to preview allowance and deduction import.'));
        }

        return (await response.json()) as PayrollAllowanceDeductionImportPreview;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to preview allowance and deduction import.';
        return null;
      } finally {
        this.isImportingFile = false;
      }
    },

    async confirmAllowanceDeductionImport(payrollRunId: string, rows: PayrollAllowanceDeductionImportRow[]) {
      this.isImportingFile = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs/${payrollRunId}/allowance-deduction-import/confirm`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify({ rows }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to post allowance and deduction import.'));
        }

        return (await response.json()) as PayrollAllowanceDeductionImportPreview;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to post allowance and deduction import.';
        return null;
      } finally {
        this.isImportingFile = false;
      }
    },

    async fetchPayrollRunEmployeeSummary(payrollRunId: string) {
      this.isLoadingPayrollRunSummary = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs/${payrollRunId}/employee-summary`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch payroll run employee summary.'));
        }

        const payload = (await response.json()) as PayrollRunEmployeeSummary;
        this.payrollRunEmployeeSummary = {
          ...payload,
          rows: Array.isArray(payload.rows) ? payload.rows : [],
        };

        return this.payrollRunEmployeeSummary;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch payroll run employee summary.';
        this.payrollRunEmployeeSummary = null;
        return null;
      } finally {
        this.isLoadingPayrollRunSummary = false;
      }
    },

    async processPayrollRun(payrollRunId: string) {
      this.isProcessingPayrollRun = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs/${payrollRunId}/process`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to process payroll run.'));
        }

        const payload = (await response.json()) as { data?: PayrollRunProcessResult };
        const result = payload.data;

        if (!result?.payrollRunId) {
          throw new Error('Payroll run was processed, but the response could not be read.');
        }

        this.payrollRuns = this.payrollRuns.map((run) =>
          run.id === result.payrollRunId
            ? { ...run, status: result.status }
            : run,
        );
        this.payPeriods = this.payPeriods.map((period) =>
          period.payrollRunId === result.payrollRunId
            ? { ...period, payrollRunStatus: result.status }
            : period,
        );

        return result;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to process payroll run.';
        return null;
      } finally {
        this.isProcessingPayrollRun = false;
      }
    },

    async openPayrollRunPayslips(
      payrollRunId: string,
      sort: PayslipSort = 'last_name',
      employeeId?: string | null,
      departmentId?: number | null,
    ) {
      this.isGeneratingPayslips = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ sort });
        if (employeeId) {
          params.set('employee_id', employeeId);
        }
        if (departmentId) {
          params.set('department_id', String(departmentId));
        }
        const response = await fetch(`${API_URL}/payroll-runs/${payrollRunId}/payslips?${params.toString()}`, {
          headers: this.buildAuthHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to generate payslips.'));
        }

        const html = await response.text();
        const payslipWindow = window.open('', '_blank');

        if (!payslipWindow) {
          throw new Error('Unable to open payslips. Allow pop-ups for this site and try again.');
        }

        payslipWindow.document.open('text/html', 'replace');
        payslipWindow.document.write(html);
        payslipWindow.document.close();
        payslipWindow.focus();

        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to generate payslips.';
        return false;
      } finally {
        this.isGeneratingPayslips = false;
      }
    },

    normalizePayPeriod(period: PayPeriodApiRow | null | undefined): PayPeriodSchedule | null {
      if (!period?.id) {
        return null;
      }

      const payPeriodGroup = period.payPeriodGroup ?? period.pay_period_group ?? null;

      return {
        id: period.id,
        startDate: (period.start_date ?? '').slice(0, 10),
        endDate: (period.end_date ?? '').slice(0, 10),
        payDate: (period.pay_date ?? '').slice(0, 10),
        payPeriodGroupId: period.payPeriodGroupId ?? period.pay_period_group_id ?? payPeriodGroup?.id ?? null,
        payPeriodGroupName: payPeriodGroup?.name ?? null,
      };
    },

    normalizePayrollRun(row: PayrollRunApiRow): PayrollRun | null {
      const payPeriod = this.normalizePayPeriod(row.payPeriodSchedule ?? row.pay_period_schedule);
      const payPeriodScheduleId = row.pay_period_schedule_id ?? payPeriod?.id ?? null;

      if (!row.id || !payPeriodScheduleId) {
        return null;
      }

      return {
        id: row.id,
        payPeriodScheduleId,
        status: row.status ?? 'draft',
        payPeriodSchedule: payPeriod,
      };
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
        const payrollRunsByPeriod = new Map(
          this.payrollRuns.map((run) => [run.payPeriodScheduleId, run]),
        );

        this.payPeriods = periods
          .map((period) => this.normalizePayPeriod(period))
          .filter((period): period is PayPeriodSchedule => period !== null)
          .map((period) => {
            const payrollRun = payrollRunsByPeriod.get(period.id);

            return {
              ...period,
              payrollRunId: payrollRun?.id ?? null,
              payrollRunStatus: payrollRun?.status ?? null,
            };
          });
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch pay periods.';
      } finally {
        this.isLoadingPayPeriods = false;
      }
    },

    async fetchPayrollRuns() {
      this.isLoadingPayrollRuns = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs?per_page=100`, {
          headers: this.buildJsonHeaders(),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to fetch payroll runs.'));
        }

        const payload = await response.json();
        const rows = (Array.isArray(payload.data) ? payload.data : []) as PayrollRunApiRow[];

        this.payrollRuns = rows
          .map((row) => this.normalizePayrollRun(row))
          .filter((run): run is PayrollRun => run !== null);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to fetch payroll runs.';
      } finally {
        this.isLoadingPayrollRuns = false;
      }
    },

    async createDraftPayrollRun(payPeriodScheduleId: string) {
      this.isLoadingPayrollRuns = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/payroll-runs`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify({
            id: crypto.randomUUID(),
            pay_period_schedule_id: payPeriodScheduleId,
            status: 'draft',
          }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to create payroll run.'));
        }

        const payload = (await response.json()) as PayrollRunApiRow;
        const payrollRun = this.normalizePayrollRun(payload);

        if (!payrollRun) {
          throw new Error('Payroll run was created, but the response could not be read.');
        }

        this.payrollRuns = [
          payrollRun,
          ...this.payrollRuns.filter((run) => run.id !== payrollRun.id),
        ];
        this.payPeriods = this.payPeriods.map((period) =>
          period.id === payrollRun.payPeriodScheduleId
            ? {
                ...period,
                payrollRunId: payrollRun.id,
                payrollRunStatus: payrollRun.status,
              }
            : period,
        );

        return payrollRun;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to create payroll run.';
        return null;
      } finally {
        this.isLoadingPayrollRuns = false;
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
        const params = this.buildTimesheetParams(filters, page, effectiveRowsPerPage);

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
          paidHours: payload.summary?.paidHours ?? 0,
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
      payload: { approvalStatus: 'APPROVED' | 'REJECTED' | 'PENDING'; remarks?: string | undefined },
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

        const body = await response.json();
        const updated = body.data as TimesheetRow;

        const index = this.timesheets.findIndex((row) => row.id === id);
        if (index >= 0) {
          this.timesheets[index] = updated;
        }

        const detailIndex = this.employeeTimesheetDetails.findIndex((row) => row.id === id);
        if (detailIndex >= 0) {
          this.employeeTimesheetDetails[detailIndex] = updated;
        }

        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update timesheet approval.';
        return null;
      } finally {
        this.isUpdatingApproval = false;
      }
    },

    async resolveTimesheetLeaveConflict(id: string, note: string) {
      this.isUpdatingApproval = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/${id}/resolve-leave-conflict`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify({ note }),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to resolve leave conflict.'));
        }

        const body = await response.json();
        const updated = body.data as TimesheetRow;

        const index = this.timesheets.findIndex((row) => row.id === id);
        if (index >= 0) {
          this.timesheets[index] = updated;
        }

        const detailIndex = this.employeeTimesheetDetails.findIndex((row) => row.id === id);
        if (detailIndex >= 0) {
          this.employeeTimesheetDetails[detailIndex] = updated;
        }

        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to resolve leave conflict.';
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

    async recalculateCompensation(payload: {
      employeeIds?: string[] | undefined;
      allActiveCompensation?: boolean | undefined;
      startDate?: string | undefined;
      endDate?: string | undefined;
      payPeriodGroupId?: string | undefined;
    }) {
      this.isRecalculatingCompensation = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/recalculate-compensation`, {
          method: 'POST',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to recalculate timesheet compensation.'));
        }

        return (await response.json()) as TimesheetCompensationRecalculationResult;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to recalculate timesheet compensation.';
        return null;
      } finally {
        this.isRecalculatingCompensation = false;
      }
    },

    async updateTimesheetRoundOff(
      id: string,
      payload: { roundOffClockInTime: string | null; roundOffClockOutTime: string | null },
    ) {
      this.isUpdatingRoundOff = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/${id}/round-off`, {
          method: 'PATCH',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to update round-off times.'));
        }

        const body = await response.json();
        const updated = body.data as TimesheetRow;
        const affected = Array.isArray(body.affected) ? (body.affected as TimesheetRow[]) : [updated];

        this.mergeAffectedTimesheets(affected);

        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update round-off times.';
        return null;
      } finally {
        this.isUpdatingRoundOff = false;
      }
    },

    async updateTimesheetLunchHours(id: string, payload: { lunchHourHours: number }) {
      this.isUpdatingRoundOff = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/${id}/lunch-hours`, {
          method: 'PATCH',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to update lunch hours.'));
        }

        const body = await response.json();
        const updated = body.data as TimesheetRow;
        const affected = Array.isArray(body.affected) ? (body.affected as TimesheetRow[]) : [updated];

        this.mergeAffectedTimesheets(affected);

        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update lunch hours.';
        return null;
      } finally {
        this.isUpdatingRoundOff = false;
      }
    },

    async updateTimesheetPaidStatus(id: string, payload: { isPaid: boolean }) {
      this.isUpdatingRoundOff = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/timesheets/${id}/paid-status`, {
          method: 'PATCH',
          headers: this.buildJsonHeaders(),
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          throw new Error(await this.parseError(response, 'Failed to update paid status.'));
        }

        const body = await response.json();
        const updated = body.data as TimesheetRow;

        const index = this.timesheets.findIndex((row) => row.id === id);
        if (index >= 0) {
          this.timesheets[index] = updated;
        }

        const detailIndex = this.employeeTimesheetDetails.findIndex((row) => row.id === id);
        if (detailIndex >= 0) {
          this.employeeTimesheetDetails[detailIndex] = updated;
        }

        return updated;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to update paid status.';
        return null;
      } finally {
        this.isUpdatingRoundOff = false;
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
      if (filters.employmentDetailId) params.append('employmentDetailId', filters.employmentDetailId);
      if (filters.payPeriodGroupId) params.append('payPeriodGroupId', filters.payPeriodGroupId);
      if (filters.departmentId) params.append('departmentId', String(filters.departmentId));
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
        paidHours: summary?.paidHours ?? 0,
      };
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAttendanceStore, import.meta.hot));
}
