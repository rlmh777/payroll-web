import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

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

export interface ScheduledVsWorkedHoursRow {
  employeeId: string;
  employeeCode: string | null;
  employeeName: string;
  scheduledHours: number;
  scheduledAmount: number;
  workedHours: number;
  workedAmount: number;
  overtimeHours: number;
  overtimeAmount: number;
  tips: number;
  shares: number;
  specialAssignments: number;
}

export interface ScheduledVsWorkedHoursReport {
  payrollRunId: string;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string;
  payPeriodEndDate: string;
  rows: ScheduledVsWorkedHoursRow[];
  totals: Omit<ScheduledVsWorkedHoursRow, 'employeeId' | 'employeeCode' | 'employeeName'>;
}

export interface PayeEmploymentDetailsRow {
  employeeId: string;
  tin: string;
  taxpayerName: string;
  socialSecurityNumber: string;
  passport: string | null;
  numberOfWeeksEmployed: number;
  totalEmoluments: number;
  taxableBenefits: number;
  commissions: number;
  taxWithheld: number;
}

export interface PayeEmploymentDetailsReport {
  year: number;
  month: number | null;
  period: string;
  startDate: string;
  endDate: string;
  submitter: {
    tin: string;
    name: string;
    address: string;
  };
  rows: PayeEmploymentDetailsRow[];
  totals: {
    totalEmoluments: number;
    taxableBenefits: number;
    commissions: number;
    taxWithheld: number;
  };
}

export interface SocialSecurityPaymentsByMonthRow {
  id: string;
  employeeId: string | null;
  employeeSocialSecurityNumber: string | null;
  companySocialSecurityNumber: string | null;
  year: number;
  monthName: string;
  calendarWeek: number;
  weekMondayDate: string | null;
  weeklyGrossPay: number;
  socialSecurityAmount: number;
  electronicEmployerNumber: string | null;
  dateHired: string | null;
  blank: string;
  firstName: string | null;
  lastName: string | null;
  recordCode: string;
}

export interface SocialSecurityPaymentsByMonthReport {
  id: string | null;
  year: number;
  month: number;
  monthName: string;
  calculatedAt: string | null;
  rows: SocialSecurityPaymentsByMonthRow[];
  totals: {
    weeklyGrossPay: number;
    socialSecurityAmount: number;
    rowCount: number;
  };
}

export interface SocialSecurityPaymentsByMonthPeriods {
  years: number[];
  monthsByYear: Record<string, Array<{ value: number; label: string }>>;
}

export interface BankUploadReportRow {
  transactionType: string;
  paymentType: string;
  branchNumber: string;
  default1: number;
  default2: number;
  default3: number;
  accountNumber: string;
  employeeName: string;
  netPay: number;
  payrollNumberLabel: string;
  csvLine: string;
}

export interface BankUploadReport {
  payrollRunId: string;
  payrollNumber: number;
  payrollNumberFormatted: string;
  payrollNumberLabel: string;
  payPeriodGroupId: string | null;
  payPeriodGroupName: string | null;
  payPeriodStartDate: string | null;
  payPeriodEndDate: string | null;
  companyName?: string | null;
  generatedOn?: string | null;
  branchNumber: string;
  rows: BankUploadReportRow[];
  totals: {
    rowCount: number;
    netPay: number;
  };
  csv: string;
}

export const useReportsStore = defineStore('reports', {
  state: () => ({
    journalEntryReport: null as JournalEntryReport | null,
    salaryReviewReport: null as SalaryReviewReport | null,
    payrollSummaryByDepartmentReport: null as PayrollSummaryByDepartmentReport | null,
    payrollJournalDepartmentsReport: null as PayrollJournalDepartmentsReport | null,
    scheduledVsWorkedHoursReport: null as ScheduledVsWorkedHoursReport | null,
    payeEmploymentDetailsReport: null as PayeEmploymentDetailsReport | null,
    socialSecurityPaymentsByMonthReport: null as SocialSecurityPaymentsByMonthReport | null,
    socialSecurityPaymentsByMonthPeriods: null as SocialSecurityPaymentsByMonthPeriods | null,
    bankUploadReport: null as BankUploadReport | null,
    isLoadingJournalEntries: false,
    isLoadingSalaryReview: false,
    isLoadingPayrollSummaryByDepartment: false,
    isLoadingPayrollJournalDepartments: false,
    isLoadingScheduledVsWorkedHours: false,
    isLoadingPayeEmploymentDetails: false,
    isLoadingSocialSecurityPaymentsByMonth: false,
    isLoadingSocialSecurityPaymentsByMonthPeriods: false,
    isRecalculatingSocialSecurityPaymentsByMonth: false,
    isLoadingBankUpload: false,
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

    async fetchScheduledVsWorkedHoursReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingScheduledVsWorkedHours = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ payroll_run_id: payrollRunId });
        const response = await fetch(
          `${API_URL}/reports/scheduled-vs-worked-hours?${params.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load scheduled vs worked hours report.'));
        }

        this.scheduledVsWorkedHoursReport = body as ScheduledVsWorkedHoursReport;
        return true;
      } catch (error) {
        this.scheduledVsWorkedHoursReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to load scheduled vs worked hours report.';
        return false;
      } finally {
        this.isLoadingScheduledVsWorkedHours = false;
      }
    },

    clearScheduledVsWorkedHoursReport() {
      this.scheduledVsWorkedHoursReport = null;
      this.error = null;
    },

    async fetchPayeEmploymentDetailsReport(params: {
      year: number;
      month?: number | null;
      scope?: 'yearly' | 'monthly';
    }): Promise<boolean> {
      this.isLoadingPayeEmploymentDetails = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(params.year),
          scope: params.scope ?? (params.month ? 'monthly' : 'yearly'),
        });
        if (params.month) {
          query.append('month', String(params.month));
        }

        const response = await fetch(
          `${API_URL}/reports/paye-employment-details?${query.toString()}`,
          { headers: this.buildHeaders() },
        );

        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load PAYE Employment Details report.'));
        }

        this.payeEmploymentDetailsReport = body as PayeEmploymentDetailsReport;
        return true;
      } catch (error) {
        this.payeEmploymentDetailsReport = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load PAYE Employment Details report.';
        return false;
      } finally {
        this.isLoadingPayeEmploymentDetails = false;
      }
    },

    clearPayeEmploymentDetailsReport() {
      this.payeEmploymentDetailsReport = null;
      this.error = null;
    },

    async fetchSocialSecurityPaymentsByMonthPeriods(): Promise<boolean> {
      this.isLoadingSocialSecurityPaymentsByMonthPeriods = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month/periods`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load available payroll periods.'));
        }

        this.socialSecurityPaymentsByMonthPeriods = body as SocialSecurityPaymentsByMonthPeriods;
        return true;
      } catch (error) {
        this.socialSecurityPaymentsByMonthPeriods = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load available payroll periods.';
        return false;
      } finally {
        this.isLoadingSocialSecurityPaymentsByMonthPeriods = false;
      }
    },

    async fetchSocialSecurityPaymentsByMonthReport(year: number, month: number): Promise<boolean> {
      this.isLoadingSocialSecurityPaymentsByMonth = true;
      this.error = null;

      try {
        const query = new URLSearchParams({
          year: String(year),
          month: String(month),
        });
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month?${query.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to load social security payments report.'));
        }

        this.socialSecurityPaymentsByMonthReport = body as SocialSecurityPaymentsByMonthReport;
        return true;
      } catch (error) {
        this.socialSecurityPaymentsByMonthReport = null;
        this.error = error instanceof Error
          ? error.message
          : 'Failed to load social security payments report.';
        return false;
      } finally {
        this.isLoadingSocialSecurityPaymentsByMonth = false;
      }
    },

    async recalculateSocialSecurityPaymentsByMonthReport(year: number, month: number): Promise<boolean> {
      this.isRecalculatingSocialSecurityPaymentsByMonth = true;
      this.error = null;

      try {
        const response = await fetch(
          `${API_URL}/reports/social-security-payments-by-month/recalculate`,
          {
            method: 'POST',
            headers: this.buildHeaders(),
            body: JSON.stringify({ year, month }),
          },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to recalculate social security payments report.'));
        }

        this.socialSecurityPaymentsByMonthReport = body as SocialSecurityPaymentsByMonthReport;
        return true;
      } catch (error) {
        this.error = error instanceof Error
          ? error.message
          : 'Failed to recalculate social security payments report.';
        return false;
      } finally {
        this.isRecalculatingSocialSecurityPaymentsByMonth = false;
      }
    },

    clearSocialSecurityPaymentsByMonthReport() {
      this.socialSecurityPaymentsByMonthReport = null;
      this.error = null;
    },

    async fetchBankUploadReport(payrollRunId: string): Promise<boolean> {
      this.isLoadingBankUpload = true;
      this.error = null;

      try {
        const params = new URLSearchParams({ payroll_run_id: payrollRunId });
        const response = await fetch(
          `${API_URL}/reports/bank-upload?${params.toString()}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({} as Record<string, unknown>));
        if (!response.ok) {
          throw new Error(this.parseError(body, 'Failed to generate bank upload report.'));
        }

        this.bankUploadReport = body as BankUploadReport;
        return true;
      } catch (error) {
        this.bankUploadReport = null;
        this.error = error instanceof Error ? error.message : 'Failed to generate bank upload report.';
        return false;
      } finally {
        this.isLoadingBankUpload = false;
      }
    },

    clearBankUploadReport() {
      this.bankUploadReport = null;
      this.error = null;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReportsStore, import.meta.hot));
}
