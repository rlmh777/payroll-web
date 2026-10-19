import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { formatDate } from '../components/attendance/utils';
import type { ScheduledVsWorkedHoursReport, ScheduledVsWorkedHoursRow } from '@payroll/stores/reports-store';
import { openPrintableReport } from '@payroll/utils/printable-report';

const HEADERS = [
  'Employee',
  'Department',
  'Position',
  'Scheduled Hrs',
  'Scheduled Cost',
  'Actual Hrs',
  'Actual Cost',
  'OT Hrs',
  'OT Cost',
  'Tips',
  'Shares',
  'Special Assignments',
];

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function line(row: ScheduledVsWorkedHoursRow, formatted: boolean): (string | number)[] {
  const amount = (value: number) => (formatted ? money(value) : value);
  return [
    row.employeeName,
    row.department,
    row.position,
    formatted ? row.scheduledHours.toFixed(2) : row.scheduledHours,
    amount(row.scheduledAmount),
    formatted ? row.workedHours.toFixed(2) : row.workedHours,
    amount(row.workedAmount),
    formatted ? row.overtimeHours.toFixed(2) : row.overtimeHours,
    amount(row.overtimeAmount),
    amount(row.tips),
    amount(row.shares),
    amount(row.specialAssignments),
  ];
}

function totals(report: ScheduledVsWorkedHoursReport, formatted: boolean): (string | number)[] {
  const amount = (value: number) => (formatted ? money(value) : value);
  return [
    'Totals',
    '',
    '',
    formatted ? report.totals.scheduledHours.toFixed(2) : report.totals.scheduledHours,
    amount(report.totals.scheduledAmount),
    formatted ? report.totals.workedHours.toFixed(2) : report.totals.workedHours,
    amount(report.totals.workedAmount),
    formatted ? report.totals.overtimeHours.toFixed(2) : report.totals.overtimeHours,
    amount(report.totals.overtimeAmount),
    amount(report.totals.tips),
    amount(report.totals.shares),
    amount(report.totals.specialAssignments),
  ];
}

function lines(report: ScheduledVsWorkedHoursReport): string[] {
  return [
    report.scopeLabel,
    `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`,
  ];
}

export function exportScheduledVsWorkedHoursExcel(
  report: ScheduledVsWorkedHoursReport,
  rows: ScheduledVsWorkedHoursRow[],
): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Scheduled Hours Cost vs Actual'],
    ...lines(report).map((line) => [line]),
    [],
    HEADERS,
    ...rows.map((row) => line(row, false)),
    totals(report, false),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Scheduled vs actual');
  void saveReportWorkbook(workbook, `scheduled-vs-worked-hours-${report.startDate}-to-${report.endDate}.xlsx`);
}

export function exportScheduledVsWorkedHoursPdf(
  report: ScheduledVsWorkedHoursReport,
  rows: ScheduledVsWorkedHoursRow[],
): boolean {
  return openPrintableReport({
    title: 'Scheduled Hours Cost vs Actual',
    lines: lines(report),
    sections: [{
      rows: [HEADERS, ...rows.map((row) => line(row, true)), totals(report, true)],
    }],
  });
}
