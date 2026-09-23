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
  const columns = report.earningColumns ?? [];
  const header: Array<string | number> = ['Department', 'Employee Code', 'Employee Name'];
  columns.forEach((column) => {
    if (column.showHours) {
      header.push(`${column.name} Hours`);
    }
    header.push(column.name);
  });
  header.push('Gross Pay');

  const rows: Array<Array<string | number>> = [
    ['Payroll Summary by Department'],
    ['Pay period group', report.payPeriodGroupName ?? '—'],
    ['Pay period date range', `${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`],
    ['Pay period number', report.payPeriodNumber],
    [],
    header,
  ];

  report.departments.forEach((department) => {
    department.rows.forEach((row) => {
      const line: Array<string | number> = [
        department.departmentName,
        row.employeeCode ?? '',
        row.employeeName,
      ];
      columns.forEach((column) => {
        if (column.showHours) {
          line.push(row.hours?.[column.key] ?? 0);
        }
        line.push(row.amounts?.[column.key] ?? 0);
      });
      line.push(row.grossPay);
      rows.push(line);
    });

    const totals: Array<string | number> = [`${department.departmentName} Totals`, '', ''];
    columns.forEach((column) => {
      if (column.showHours) {
        totals.push(department.totals.hours?.[column.key] ?? 0);
      }
      totals.push(department.totals.amounts?.[column.key] ?? 0);
    });
    totals.push(department.totals.grossPay);
    rows.push(totals);
    rows.push([]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = header.map((_, index) => ({ wch: index < 3 ? 22 : 16 }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Summary');

  const startDate = sanitizeFilename(formatDate(report.payPeriodStartDate));
  const endDate = sanitizeFilename(formatDate(report.payPeriodEndDate));
  XLSX.writeFile(workbook, `payroll-summary-by-department_${startDate}_to_${endDate}.xlsx`);
}

export function formatPayrollSummaryCurrency(value: number): string {
  return formatCurrency(value);
}
