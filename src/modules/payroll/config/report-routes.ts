export type ReportId =
  | 'journal-entries'
  | 'salary-review'
  | 'payroll-summary-by-department'
  | 'payroll-journal-departments'
  | 'scheduled-vs-worked-hours'
  | 'paye-employment-details'
  | 'social-security-payments-by-month'
  | 'bank-upload'
  | 'gst-calculator';

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
    label: 'Scheduled vs Worked Hours',
    caption: 'Scheduled/worked, OT, tips, shares, specials',
    icon: 'query_stats',
  },
  {
    id: 'paye-employment-details',
    label: 'PAYE Employment Details',
    caption: 'Belize Tax Services PAYE upload workbook',
    icon: 'account_balance',
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

export function reportPath(id: ReportId): string {
  return `/reports/${id}`;
}
