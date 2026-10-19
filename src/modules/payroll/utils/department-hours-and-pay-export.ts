import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { openPrintableReport } from '@payroll/utils/printable-report';
import type { DepartmentHoursAndPayReport, DepartmentHoursAndPayRow } from '@payroll/stores/reports-store';

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

function formatStartDate(value: string | null): string {
  if (!value) {
    return '';
  }
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}/${day}/${year}`;
}

function rowValues(row: DepartmentHoursAndPayRow): (string | number)[] {
  return [
    row.department,
    row.employeeName,
    formatStartDate(row.startDate),
    money(row.shares),
    row.position,
    money(row.biweeklyBaseSalary),
    money(row.regularHours),
    money(row.overtimeHours),
    money(row.holidayHours),
    money(row.vacationHours),
    money(row.totalHours),
    money(row.totalPay),
    money(row.staffGratuity),
    money(row.tips),
    money(row.specialPay),
    money(row.reservationCommission),
    money(row.combinedYtdPay),
  ];
}

export function exportDepartmentHoursAndPayExcel(report: DepartmentHoursAndPayReport): void {
  const groupHeaders = [
    'Employee',
    '',
    '',
    '',
    '',
    '',
    'Hours',
    '',
    '',
    '',
    '',
    'Pay',
    '',
    '',
    '',
    '',
    '',
  ];
  const columnHeaders = [
    'Dept',
    'Name',
    'Start Date MM/DD/YY',
    'Shares',
    'Position',
    'Reg 2 wk BASE Salary',
    'Reg Hrs',
    'OT Hrs',
    'Holiday Hrs',
    'Vacation Hrs',
    'Total Hrs',
    'TOTAL PAY',
    'Staff Grat',
    'Tips',
    'SPECIAL PAY',
    'Resv Comm',
    'Combined YTD TOTAL PAY (incl Grat, Tips, Trips, etc)',
  ];
  const totals = report.totals;
  const totalsRow: (string | number)[] = [
    'Totals',
    '',
    '',
    money(totals.shares),
    '',
    money(totals.biweeklyBaseSalary),
    money(totals.regularHours),
    money(totals.overtimeHours),
    money(totals.holidayHours),
    money(totals.vacationHours),
    money(totals.totalHours),
    money(totals.totalPay),
    money(totals.staffGratuity),
    money(totals.tips),
    money(totals.specialPay),
    money(totals.reservationCommission),
    money(totals.combinedYtdPay),
  ];

  const sheet = XLSX.utils.aoa_to_sheet([
    ['Department Hours and Pay'],
    [report.scopeLabel],
    [`${report.startDate} - ${report.endDate}`],
    [`Employees: ${report.employeeCount}`],
    [],
    groupHeaders,
    columnHeaders,
    ...report.rows.map((row) => rowValues(row)),
    [],
    totalsRow,
  ]);

  sheet['!merges'] = [
    { s: { r: 5, c: 0 }, e: { r: 5, c: 5 } },
    { s: { r: 5, c: 6 }, e: { r: 5, c: 10 } },
    { s: { r: 5, c: 11 }, e: { r: 5, c: 16 } },
  ];
  sheet['!cols'] = columnHeaders.map((label) => ({
    wch: Math.min(36, Math.max(12, label.length + 2)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Department hours and pay');
  const filename = sanitizeFilename(
    `department-hours-and-pay-${report.startDate}-to-${report.endDate}`,
  );
  void saveReportWorkbook(workbook, `${filename || 'department-hours-and-pay'}.xlsx`);
}

export function exportDepartmentHoursAndPayPdf(report: DepartmentHoursAndPayReport): boolean {
  const columnHeaders = [
    'Dept',
    'Name',
    'Start Date',
    'Shares',
    'Position',
    'Reg 2 wk BASE Salary',
    'Reg Hrs',
    'OT Hrs',
    'Holiday Hrs',
    'Vacation Hrs',
    'Total Hrs',
    'TOTAL PAY',
    'Staff Grat',
    'Tips',
    'SPECIAL PAY',
    'Resv Comm',
    'Combined YTD TOTAL PAY',
  ];
  const totals = report.totals;
  const totalsRow: (string | number)[] = [
    'Totals',
    '',
    '',
    money(totals.shares),
    '',
    money(totals.biweeklyBaseSalary),
    money(totals.regularHours),
    money(totals.overtimeHours),
    money(totals.holidayHours),
    money(totals.vacationHours),
    money(totals.totalHours),
    money(totals.totalPay),
    money(totals.staffGratuity),
    money(totals.tips),
    money(totals.specialPay),
    money(totals.reservationCommission),
    money(totals.combinedYtdPay),
  ];

  return openPrintableReport({
    title: 'Department Hours and Pay',
    lines: [report.scopeLabel, `${report.startDate} - ${report.endDate}`, `Employees: ${report.employeeCount}`],
    sections: [{
      rows: [columnHeaders, ...report.rows.map((row) => rowValues(row)), totalsRow],
    }],
  });
}
