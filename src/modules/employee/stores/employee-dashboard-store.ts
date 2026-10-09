import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type BirthdayVisibility = 'none' | 'department' | 'company';

export interface EmployeeDashboardShift {
  id: string;
  startTime: string | null;
  endTime: string | null;
  description: string | null;
  departmentName: string | null;
  worksiteName: string | null;
}

export interface EmployeeDashboardDay {
  date: string;
  weekday: string;
  shifts: EmployeeDashboardShift[];
  holiday: { id: string | number; name: string } | null;
  leave: { id: string; leaveTypeName: string; status: string | null } | null;
}

export interface EmployeeDashboardEvent {
  id: string;
  type: 'holiday' | 'event' | 'birthday';
  title: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  color?: string | null;
}

export interface EmployeeDashboardLeaveBalance {
  leaveTypeId: number;
  code?: string | null;
  name: string;
  isPaid?: boolean;
  annualEntitlementDays: number;
  accruedDays: number;
  takenDays: number;
  scheduledDays: number;
  availableDays: number;
  affectsBalance: boolean;
  accrualMethod: string;
}

export interface EmployeeDashboardPayslip {
  id: string;
  payrollRunId: string;
  payrollNumber: string | null;
  date: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  totalAllowances: number;
}

export interface EmployeeDashboardPayload {
  employee: {
    id: string;
    code: string | null;
    name: string | null;
    departmentId: number | null;
    departmentName: string | null;
  } | null;
  birthdayVisibility: BirthdayVisibility;
  schedule: {
    start: string;
    end: string;
    days: EmployeeDashboardDay[];
  };
  upcomingEvents: EmployeeDashboardEvent[];
  leaves: {
    asOf: string;
    balances: EmployeeDashboardLeaveBalance[];
    upcoming: Array<{
      id: string;
      leaveTypeName: string;
      status: string | null;
      startDate: string;
      endDate: string;
      totalDays: number;
    }>;
  };
  payslips: EmployeeDashboardPayslip[];
}

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export const useEmployeeDashboardStore = defineStore('employeeDashboard', {
  state: () => ({
    data: null as EmployeeDashboardPayload | null,
    isLoading: false,
    isOpeningPayslip: false,
    isDownloadingPayslip: false,
    payslipBusyId: null as string | null,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { Accept: 'application/json' };
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchDashboard(weekStart?: string) {
      this.isLoading = true;
      this.error = null;
      try {
        const params = new URLSearchParams();
        if (weekStart) {
          params.set('week_start', weekStart);
        }
        const query = params.toString();
        const response = await fetch(
          `${API_URL}/employee-dashboard${query ? `?${query}` : ''}`,
          { headers: this.buildHeaders() },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to load employee dashboard');
        }
        this.data = body as EmployeeDashboardPayload;
      } catch (error) {
        this.data = null;
        this.error = error instanceof Error ? error.message : 'Failed to load employee dashboard';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchPayslipHtml(payrollRunId: string): Promise<string> {
      const response = await fetch(`${API_URL}/employee-dashboard/payslips/${payrollRunId}`, {
        headers: { ...this.buildHeaders(), Accept: 'text/html' },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to load payslip');
      }

      return response.text();
    },

    async openPayslip(payrollRunId: string) {
      this.isOpeningPayslip = true;
      this.payslipBusyId = payrollRunId;
      this.error = null;
      try {
        const html = await this.fetchPayslipHtml(payrollRunId);
        const payslipWindow = window.open('', '_blank');
        if (!payslipWindow) {
          throw new Error('Unable to open payslip. Allow pop-ups for this site and try again.');
        }
        payslipWindow.document.open('text/html', 'replace');
        payslipWindow.document.write(html);
        payslipWindow.document.close();
        payslipWindow.focus();
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to open payslip';
        return false;
      } finally {
        this.isOpeningPayslip = false;
        this.payslipBusyId = null;
      }
    },

    async downloadPayslip(payrollRunId: string, filename: string) {
      this.isDownloadingPayslip = true;
      this.payslipBusyId = payrollRunId;
      this.error = null;
      try {
        const html = await this.fetchPayslipHtml(payrollRunId);
        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename.endsWith('.html') ? filename : `${filename}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        return true;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to download payslip';
        return false;
      } finally {
        this.isDownloadingPayslip = false;
        this.payslipBusyId = null;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useEmployeeDashboardStore, import.meta.hot));
}
