import * as XLSX from 'xlsx';
import { formatDate } from '../components/attendance/utils';
import type { PayrollSummaryByDepartmentReport } from '@payroll/stores/reports-store';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function exportPayrollSummaryByDepartmentExcel(report: PayrollSummaryByDepartmentReport): void {
  const rows: Array<Array<string | number>> = [
    ['Payroll Summary by Department'],
    ['Pay period group', report.payPeriodGroupName ?? '—'],
    ['Pay period date range', `${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`],
    ['Pay period number', report.payPeriodNumber],
    [],
    [
      'Department',
      'Employee Code',
      'Employee Name',
      'Regular Hours',
      'Regular Amount',
      'Overtime Hours',
      'Overtime Amount',
      'Double Time',
      'Double Time Amount',
      'Allowances',
      'Gross Pay',
    ],
  ];

  report.departments.forEach((department) => {
    department.rows.forEach((row) => {
      rows.push([
        department.departmentName,
        row.employeeCode ?? '',
        row.employeeName,
        row.regularHours,
        row.regularAmount,
        row.overtimeHours,
        row.overtimeAmount,
        row.doubleTimeHours,
        row.doubleTimeAmount,
        row.allowances,
        row.grossPay,
      ]);
    });

    rows.push([
      `${department.departmentName} Totals`,
      '',
      '',
      department.totals.regularHours,
      department.totals.regularAmount,
      department.totals.overtimeHours,
      department.totals.overtimeAmount,
      department.totals.doubleTimeHours,
      department.totals.doubleTimeAmount,
      department.totals.allowances,
      department.totals.grossPay,
    ]);
    rows.push([]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 22 },
    { wch: 14 },
    { wch: 30 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Summary');

  const startDate = sanitizeFilename(formatDate(report.payPeriodStartDate));
  const endDate = sanitizeFilename(formatDate(report.payPeriodEndDate));
  XLSX.writeFile(workbook, `payroll-summary-by-department_${startDate}_to_${endDate}.xlsx`);
}

export function formatPayrollSummaryCurrency(value: number): string {
  return formatCurrency(value);
}
