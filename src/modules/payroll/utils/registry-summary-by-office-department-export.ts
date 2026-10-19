import * as XLSX from 'xlsx';
import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import { openPrintableReport } from '@payroll/utils/printable-report';
import type {
  RegistrySummaryByOfficeDepartmentReport,
  RegistrySummaryByOfficeDepartmentRow,
} from '@payroll/stores/reports-store';

const HEADERS = [
  'Payroll #',
  'Branch',
  'Department',
  'Process Type',
  'Wage',
  'Overtime',
  'PreTax Deduction',
  'Sick Leave Deduction',
  'Other Earnings',
  'Gross Pay',
  'Taxes',
  'S.S EE',
  'S.S ER',
  'Post Tax Ded.',
  'Non Tax Payout',
  'Net Salary',
];

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function money(value: number | null | undefined): number {
  return Number(value ?? 0);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(money(value));
}

function rowValues(row: RegistrySummaryByOfficeDepartmentRow): (string | number)[] {
  return [
    row.payrollNumber || '',
    row.branch,
    row.department,
    row.processType,
    money(row.wage),
    money(row.overtime),
    money(row.pretaxDeduction),
    money(row.sickLeaveDeduction),
    money(row.otherEarnings),
    money(row.grossPay),
    money(row.taxes),
    money(row.ssEmployee),
    money(row.ssEmployer),
    money(row.postTaxDeduction),
    money(row.nonTaxPayout),
    money(row.netSalary),
  ];
}

function totalsValues(report: RegistrySummaryByOfficeDepartmentReport): (string | number)[] {
  const totals = report.totals;
  return [
    'Totals',
    '',
    '',
    '',
    money(totals.wage),
    money(totals.overtime),
    money(totals.pretaxDeduction),
    money(totals.sickLeaveDeduction),
    money(totals.otherEarnings),
    money(totals.grossPay),
    money(totals.taxes),
    money(totals.ssEmployee),
    money(totals.ssEmployer),
    money(totals.postTaxDeduction),
    money(totals.nonTaxPayout),
    money(totals.netSalary),
  ];
}

function filename(report: RegistrySummaryByOfficeDepartmentReport): string {
  return sanitizeFilename(`Registry_Summary_By_Office_Department_${report.startDate}_to_${report.endDate}`) || 'registry-summary';
}

export function exportRegistrySummaryByOfficeDepartmentExcel(
  report: RegistrySummaryByOfficeDepartmentReport,
): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [report.title],
    [`Date Range: ${report.periodLabel}`],
    [],
    HEADERS,
    ...report.rows.map(rowValues),
    totalsValues(report),
  ]);
  sheet['!cols'] = HEADERS.map((header) => ({ wch: Math.max(header.length + 2, 14) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Registry Summary');
  void saveReportWorkbook(workbook, `${filename(report)}.xlsx`, {
    title: report.title,
    period: report.periodLabel,
  });
}

export function exportRegistrySummaryByOfficeDepartmentPdf(
  report: RegistrySummaryByOfficeDepartmentReport,
): boolean {
  const printableTotals = totalsValues(report).map((value, index) => (
    index >= 4 && typeof value === 'number' ? `$${formatMoney(value)}` : value
  ));

  return openPrintableReport({
    title: report.title,
    lines: [`Date Range: ${report.periodLabel}`],
    sections: [{
      rows: [
        HEADERS,
        ...report.rows.map((row) => rowValues(row).map((value, index) => (
          index >= 4 && typeof value === 'number' ? formatMoney(value) : value
        ))),
        printableTotals,
      ],
    }],
  });
}
