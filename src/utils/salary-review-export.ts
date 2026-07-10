import * as XLSX from 'xlsx';
import { formatDate } from 'src/components/attendance/utils';
import type { SalaryReviewReport } from 'src/stores/reports-store';

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function sanitizeSheetName(value: string): string {
  const cleaned = value.replace(/[\\/*?:[\]]/g, ' ').trim() || 'Department';
  return cleaned.slice(0, 31);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDateRange(report: SalaryReviewReport): string {
  return `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
}

function buildDepartmentSheet(
  report: SalaryReviewReport,
  department: SalaryReviewReport['departments'][number],
): Array<Array<string | number>> {
  const headerRow = ['Employee', ...department.columns];
  const dataRows = department.rows.map((row) => [
    row.employeeName,
    ...department.columns.map((column) => row.values[column] ?? 0),
  ]);
  const totalsRow = [
    'Totals',
    ...department.columns.map((column) => department.totals[column] ?? 0),
  ];

  return [
    ['Salary Review'],
    [formatDateRange(report)],
    [],
    headerRow,
    ...dataRows,
    [],
    totalsRow,
  ];
}

export function exportSalaryReviewExcel(report: SalaryReviewReport): void {
  const workbook = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();

  report.departments.forEach((department, index) => {
    const baseName = sanitizeSheetName(department.departmentName);
    let sheetName = baseName;
    let suffix = 2;

    while (usedSheetNames.has(sheetName)) {
      const trimmedBase = baseName.slice(0, Math.max(1, 28 - String(suffix).length));
      sheetName = `${trimmedBase} ${suffix}`;
      suffix += 1;
    }

    usedSheetNames.add(sheetName);

    const worksheet = XLSX.utils.aoa_to_sheet(buildDepartmentSheet(report, department));
    worksheet['!cols'] = [
      { wch: 28 },
      ...department.columns.map(() => ({ wch: 16 })),
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName || `Department ${index + 1}`);
  });

  const startDate = sanitizeFilename(formatDate(report.startDate));
  const endDate = sanitizeFilename(formatDate(report.endDate));
  XLSX.writeFile(workbook, `salary-review_${startDate}_to_${endDate}.xlsx`);
}

export function formatSalaryReviewCurrency(value: number): string {
  return formatCurrency(value);
}
