import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface JournalEntryReportRow {
  accountId: string | null;
  accountNumber: string;
  accountDescription: string;
  debit: number;
  credit: number;
}

export interface JournalEntryReport {
  payrollRunId: string;
  payPeriodGroupId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  rows: JournalEntryReportRow[];
  totals: {
    debit: number;
    credit: number;
  };
}

export interface SalaryReviewEmployeeRow {
  employeeId: string;
  employeeCode?: string | null;
  employeeName: string;
  values: Record<string, number>;
}

export interface SalaryReviewDepartment {
  departmentId: number | null;
  departmentName: string;
  columns: string[];
  rows: SalaryReviewEmployeeRow[];
  totals: Record<string, number>;
}

export interface SalaryReviewReport {
  startDate: string;
  endDate: string;
  departments: SalaryReviewDepartment[];
}

export interface PayrollSummaryByDepartmentRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  regularHours: number;
  regularAmount: number;
  overtimeHours: number;
  overtimeAmount: number;
  doubleTimeHours: number;
  doubleTimeAmount: number;
  allowances: number;
  grossPay: number;
}

export interface PayrollSummaryByDepartmentDepartment {
  departmentId: number | null;
  departmentName: string;
  rows: PayrollSummaryByDepartmentRow[];
  totals: {
    regularHours: number;
    regularAmount: number;
    overtimeHours: number;
    overtimeAmount: number;
    doubleTimeHours: number;
    doubleTimeAmount: number;
    allowances: number;
    grossPay: number;
  };
}

export interface PayrollSummaryByDepartmentReport {
  payrollRunId: string;
  payPeriodGroupId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  departments: PayrollSummaryByDepartmentDepartment[];
}

export interface PayrollJournalDepartmentsWorkRow {
  date: string;
  description?: string | null;
  rowType?: 'work' | 'deduction';
  regularHours: number;
  regularRate: number;
  regularTotal: number;
  overtimeHours: number;
  overtimeRate: number;
  overtimeTotal: number;
  holidayHours: number;
  holidayRate: number;
  holidayTotal: number;
  otherPayments: number;
  gross: number;
  tax: number | null;
  social: number | null;
  otherDeductions: number | null;
  netIncome: number;
}

export interface PayrollJournalDepartmentsEmployee {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  bankName: string | null;
  accountNumber: string | null;
  rows: PayrollJournalDepartmentsWorkRow[];
  totals: Omit<PayrollJournalDepartmentsWorkRow, 'date' | 'regularRate' | 'overtimeRate' | 'holidayRate'>;
}

export interface PayrollJournalDepartmentsDepartment {
  departmentId: number | null;
  departmentName: string;
  employees: PayrollJournalDepartmentsEmployee[];
  totals: Omit<PayrollJournalDepartmentsWorkRow, 'date' | 'regularRate' | 'overtimeRate' | 'holidayRate'>;
}

export interface PayrollJournalDepartmentsReport {
  payrollRunId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  payPeriodNumber: number;
  departments: PayrollJournalDepartmentsDepartment[];
}

export const useReportsStore = defineStore('reports', {
  state: () => ({
    journalEntryReport: null as JournalEntryReport | null,
    salaryReviewReport: null as SalaryReviewReport | null,
    payrollSummaryByDepartmentReport: null as PayrollSummaryByDepartmentReport | null,
    payrollJournalDepartmentsReport: null as PayrollJournalDepartmentsReport | null,
    isLoadingJournalEntries: false,
    isLoadingSalaryReview: false,
    isLoadingPayrollSummaryByDepartment: false,
    isLoadingPayrollJournalDepartments: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      return headers;
    },

    parseError(body: Record<string, unknown>, fallback: string): string {
      if (typeof body.message === 'string' && body.message.trim() !== '') {
        return body.message;
      }

      return fallback;
    },

    async fetchJournalEntriesReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingJournalEntries = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/journal-entries-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load journal entries report.'));
        }

        this.journalEntryReport = body as JournalEntryReport;
        return true;
      } catch (error) {
        this.journalEntryReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load journal entries report.';
        return false;
      } finally {
        this.isLoadingJournalEntries = false;
      }
    },

    clearJournalEntryReport() {
      this.journalEntryReport = null;
      this.error = null;
    },

    async fetchSalaryReviewReport(startDate: string, endDate: string): Promise<boolean> {
      this.isLoadingSalaryReview = true;
      this.error = null;

      try {
        const params = new URLSearchParams({
          start_date: startDate,
          end_date: endDate,
        });
        const response = await fetch(
          `${API_URL}/reports/salary-review?${params.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load salary review report.'));
        }

        this.salaryReviewReport = body as SalaryReviewReport;
        return true;
      } catch (error) {
        this.salaryReviewReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load salary review report.';
        return false;
      } finally {
        this.isLoadingSalaryReview = false;
      }
    },

    clearSalaryReviewReport() {
      this.salaryReviewReport = null;
      this.error = null;
    },

    async fetchPayrollSummaryByDepartmentReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingPayrollSummaryByDepartment = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/payroll-summary-by-department-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll summary by department report.'));
        }

        this.payrollSummaryByDepartmentReport = body as PayrollSummaryByDepartmentReport;
        return true;
      } catch (error) {
        this.payrollSummaryByDepartmentReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll summary by department report.';
        return false;
      } finally {
        this.isLoadingPayrollSummaryByDepartment = false;
      }
    },

    clearPayrollSummaryByDepartmentReport() {
      this.payrollSummaryByDepartmentReport = null;
      this.error = null;
    },

    async fetchPayrollJournalDepartmentsReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingPayrollJournalDepartments = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/payroll-runs/${payrollRunId}/payroll-journal-departments-report`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));

        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load payroll journal departments report.'));
        }

        this.payrollJournalDepartmentsReport = body as PayrollJournalDepartmentsReport;
        return true;
      } catch (error) {
        this.payrollJournalDepartmentsReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load payroll journal departments report.';
        return false;
      } finally {
        this.isLoadingPayrollJournalDepartments = false;
      }
    },

    clearPayrollJournalDepartmentsReport() {
      this.payrollJournalDepartmentsReport = null;
      this.error = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportsStore, import.meta.hot));
}
