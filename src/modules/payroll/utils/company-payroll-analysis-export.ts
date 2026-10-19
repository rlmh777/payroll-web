import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { openPrintableReport } from '@payroll/utils/printable-report';
import { formatDate } from '../components/attendance/utils';
import type {
  CompanyPayrollAnalysisByDepartmentReport,
  CompanyPayrollAnalysisDepartmentRow,
} from '@payroll/stores/reports-store';

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

function rowValues(row: CompanyPayrollAnalysisDepartmentRow): (string | number)[] {
  return [
    row.departmentName,
    row.employeeCount,
    money(row.regularHours),
    money(row.regularPay),
    money(row.overtimeHours),
    money(row.overtimePay),
    money(row.holidayHours),
    money(row.holidayPay),
    money(row.vacationHours),
    money(row.vacationPay),
    money(row.totalHours),
    money(row.totalPay),
    money(row.averagePayPerHour),
  ];
}

export function exportCompanyPayrollAnalysisExcel(report: CompanyPayrollAnalysisByDepartmentReport): void {
  const dateLabel = `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
  const payrollLabel = report.payrollNumber != null ? String(report.payrollNumber) : '—';
  const groupRow = [
    '',
    '',
    'Regular',
    '',
    'OT',
    '',
    'Holiday',
    '',
    'Vacation',
    '',
    'TOTAL',
    '',
    '',
  ];
  const columnRow = [
    'Dept',
    '#Employees',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    'Average Pay Per Hour',
  ];

  const sheet = XLSX.utils.aoa_to_sheet([
    [report.companyName],
    ['Company Payroll Analysis'],
    ['by Department'],
    [],
    ['Dates', 'Payroll #'],
    [dateLabel, payrollLabel],
    [],
    groupRow,
    columnRow,
    ...report.rows.map((row) => rowValues(row)),
    rowValues(report.totals),
  ]);

  const headerRow = 7;
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 12 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: 12 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: 12 } },
    { s: { r: headerRow, c: 2 }, e: { r: headerRow, c: 3 } },
    { s: { r: headerRow, c: 4 }, e: { r: headerRow, c: 5 } },
    { s: { r: headerRow, c: 6 }, e: { r: headerRow, c: 7 } },
    { s: { r: headerRow, c: 8 }, e: { r: headerRow, c: 9 } },
    { s: { r: headerRow, c: 10 }, e: { r: headerRow, c: 11 } },
  ];
  sheet['!cols'] = columnRow.map((label) => ({
    wch: Math.min(22, Math.max(12, label.length + 2)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Payroll analysis');
  const filename = sanitizeFilename(
    `company-payroll-analysis-${report.startDate}-to-${report.endDate}`,
  );
  void saveReportWorkbook(workbook, `${filename || 'company-payroll-analysis'}.xlsx`);
}

export function exportCompanyPayrollAnalysisPdf(report: CompanyPayrollAnalysisByDepartmentReport): boolean {
  const dateLabel = `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
  const payrollLabel = report.payrollNumber != null ? String(report.payrollNumber) : '—';
  const columnRow = [
    'Dept',
    '#Employees',
    'Regular Hours',
    'Regular Pay',
    'OT Hours',
    'OT Pay',
    'Holiday Hours',
    'Holiday Pay',
    'Vacation Hours',
    'Vacation Pay',
    'Total Hours',
    'Total Pay',
    'Average Pay Per Hour',
  ];

  return openPrintableReport({
    title: 'Company Payroll Analysis by Department',
    lines: [report.companyName, dateLabel, `Payroll # ${payrollLabel}`],
    sections: [{
      rows: [columnRow, ...report.rows.map((row) => rowValues(row)), rowValues(report.totals)],
    }],
  });
}
