import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { formatDate } from '../components/attendance/utils';
import type {
  PayrollJournalDepartmentsReport,
  PayrollJournalDepartmentsWorkRow,
} from '@payroll/stores/reports-store';
import { openPrintableReport } from '@payroll/utils/printable-report';

const HEADERS = [
  'Department',
  'Employee',
  'Date',
  'Regular Hours',
  'Regular Rate',
  'Regular Total',
  'OT Hours',
  'OT Rate',
  'OT Total',
  'Holiday Hours',
  'Holiday Rate',
  'Holiday Total',
  'Other Payments',
  'Gross',
  'Tax',
  'Social',
  'Other Deductions',
  'Net Income',
];

function amount(value: number | null | undefined): number {
  return Number(value ?? 0);
}

function workLine(
  department: string,
  employee: string,
  row: Omit<PayrollJournalDepartmentsWorkRow, 'date' | 'description' | 'rowType'>,
  label: string,
): (string | number)[] {
  return [
    department,
    employee,
    label,
    amount(row.regularHours),
    amount(row.regularRate),
    amount(row.regularTotal),
    amount(row.overtimeHours),
    amount(row.overtimeRate),
    amount(row.overtimeTotal),
    amount(row.holidayHours),
    amount(row.holidayRate),
    amount(row.holidayTotal),
    amount(row.otherPayments),
    amount(row.gross),
    amount(row.tax),
    amount(row.social),
    amount(row.otherDeductions),
    amount(row.netIncome),
  ];
}

function sheetRows(report: PayrollJournalDepartmentsReport): (string | number)[][] {
  const rows: (string | number)[][] = [HEADERS];
  report.departments.forEach((department) => {
    department.employees.forEach((employee) => {
      employee.rows.forEach((row) => {
        const label = row.description ? `${formatDate(row.date)} - ${row.description}` : formatDate(row.date);
        rows.push(workLine(department.departmentName, employee.employeeName, row, label));
      });
      rows.push(workLine(department.departmentName, employee.employeeName, {
        ...employee.totals,
        regularRate: 0,
        overtimeRate: 0,
        holidayRate: 0,
      }, 'Employee total'));
    });
    rows.push(workLine(department.departmentName, '', {
      ...department.totals,
      regularRate: 0,
      overtimeRate: 0,
      holidayRate: 0,
    }, 'Department total'));
  });
  return rows;
}

export function exportPayrollJournalDepartmentsExcel(report: PayrollJournalDepartmentsReport): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Payroll Journal Departments'],
    [report.payPeriodGroupName ?? ''],
    [`${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`],
    [`Payroll # ${report.payPeriodNumber}`],
    [],
    ...sheetRows(report),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Payroll journal');
  void saveReportWorkbook(workbook, `payroll-journal-departments-${report.payPeriodStartDate}-to-${report.payPeriodEndDate}.xlsx`);
}

export function exportPayrollJournalDepartmentsPdf(report: PayrollJournalDepartmentsReport): boolean {
  return openPrintableReport({
    title: 'Payroll Journal Departments',
    lines: [
      report.payPeriodGroupName ?? '',
      `${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`,
      `Payroll # ${report.payPeriodNumber}`,
    ],
    sections: [{ rows: sheetRows(report) }],
  });
}
