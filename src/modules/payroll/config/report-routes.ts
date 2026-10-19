export type ReportId =
  | 'journal-entries'
  | 'salary-review'
  | 'payroll-summary-by-department'
  | 'payroll-journal-departments'
  | 'scheduled-vs-worked-hours'
  | 'paye-employment-details'
  | 'paye-reconciliation-employee-details'
  | 'social-security-payments-by-month'
  | 'bank-upload'
  | 'gst-calculator'
  | 'labor-cost-to-date'
  | 'department-hours-and-pay'
  | 'company-payroll-analysis-by-department'
  | 'payroll-master-sheet'
  | 'salary-payments'
  | 'payroll-registry'
  | 'registry-summary-by-office-department'
  | 'paye'
  | 'td4-summary'
  | 'td4-supplementary'
  | 'emoluments-withheld-tax'
  | 'social-security-contributions'
  | 'social-security-deduction';

export interface ReportOption {
  id: ReportId;
  label: string;
  caption: string;
  icon: string;
}

export const REPORT_OPTIONS: ReportOption[] = [
  {
    id: 'journal-entries',
    label: 'Journal Entries',
    caption: 'Payroll GL lines by account',
    icon: 'menu_book',
  },
  {
    id: 'salary-review',
    label: 'Salary Review',
    caption: 'Employee pay by department and account',
    icon: 'payments',
  },
  {
    id: 'payroll-summary-by-department',
    label: 'Payroll Summary by Department',
    caption: 'Hours and pay rollup by department',
    icon: 'summarize',
  },
  {
    id: 'payroll-journal-departments',
    label: 'Payroll Journal Departments',
    caption: 'Department payroll journal by employee',
    icon: 'receipt_long',
  },
  {
    id: 'scheduled-vs-worked-hours',
    label: 'Scheduled Hours Cost vs Actual',
    caption: 'Scheduled vs actual hours and cost by run or dates',
    icon: 'query_stats',
  },
  {
    id: 'paye-employment-details',
    label: 'PAYE employee details',
    caption: 'Belize Tax Services PAYE employee details upload',
    icon: 'account_balance',
  },
  {
    id: 'paye-reconciliation-employee-details',
    label: 'PAYE Reconciliation Employee Details',
    caption: 'Annual or monthly PAYE reconciliation for a year with payroll',
    icon: 'account_balance',
  },
  {
    id: 'department-hours-and-pay',
    label: 'Department Hours and Pay',
    caption: 'Hours, pay, tips, and YTD by department',
    icon: 'table_chart',
  },
  {
    id: 'company-payroll-analysis-by-department',
    label: 'Company Payroll Analysis by Department',
    caption: 'Regular, OT, holiday, and vacation by department',
    icon: 'account_tree',
  },
  {
    id: 'payroll-master-sheet',
    label: 'Payroll Master Sheet',
    caption: 'Monthly hours, working pay, and gratuity by department',
    icon: 'grid_on',
  },
  {
    id: 'salary-payments',
    label: 'Salary Payments',
    caption: 'Period pay by department, with hours, tips, and gross',
    icon: 'payments',
  },
  {
    id: 'payroll-registry',
    label: 'Payroll Registry by Employees',
    caption: 'Processed payroll with tax, social security, and net pay',
    icon: 'badge',
  },
  {
    id: 'registry-summary-by-office-department',
    label: 'Registry Summary By Office & Department Report',
    caption: 'Department totals by payroll or date range',
    icon: 'account_tree',
  },
  {
    id: 'paye',
    label: 'PAYE',
    caption: 'Income tax withheld by company, department, or employee',
    icon: 'account_balance',
  },
  {
    id: 'td4-summary',
    label: 'TD4 Summary',
    caption: 'Annual return of emoluments paid and tax withheld',
    icon: 'description',
  },
  {
    id: 'td4-supplementary',
    label: 'Employee TD4 Supplementary',
    caption: 'A6 emoluments slip by dates, company, department, or employee',
    icon: 'badge',
  },
  {
    id: 'emoluments-withheld-tax',
    label: 'Emoluments and Withheld Tax',
    caption: 'Year, company or department, and months with payroll',
    icon: 'table_chart',
  },
  {
    id: 'social-security-deduction',
    label: 'Social Security Deduction',
    caption: 'One page per employee, calendar weeks and SS contributions',
    icon: 'health_and_safety',
  },
  {
    id: 'social-security-contributions',
    label: 'Social Security Contributions',
    caption: 'One row per employee per calendar week',
    icon: 'health_and_safety',
  },
  {
    id: 'social-security-payments-by-month',
    label: 'Social Security Payments by Month',
    caption: 'Weekly SS filing rows by Monday',
    icon: 'health_and_safety',
  },
  {
    id: 'bank-upload',
    label: 'Generate Bank Upload',
    caption: 'Salary deposit CSV for posted payroll',
    icon: 'account_balance_wallet',
  },
  {
    id: 'gst-calculator',
    label: 'GST Calculator',
    caption: 'Monthly business tax, GST, and BTB filing',
    icon: 'calculate',
  },
];

export const DEFAULT_REPORT_ID: ReportId = 'journal-entries';

const reportIds = new Set(REPORT_OPTIONS.map((report) => report.id));

export function isReportId(value: string | undefined | null): value is ReportId {
  return !!value && reportIds.has(value as ReportId);
}

export function reportLabel(id: string): string | null {
  return REPORT_OPTIONS.find((report) => report.id === id)?.label ?? null;
}

import { reportPath as moduleReportPath } from '@core/config/module-routes';

export function reportPath(id: ReportId): string {
  return moduleReportPath(id);
}
