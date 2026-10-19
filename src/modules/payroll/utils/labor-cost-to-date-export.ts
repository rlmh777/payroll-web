import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { openPrintableReport } from '@payroll/utils/printable-report';
import { formatDate } from '../components/attendance/utils';
import type {
  LaborCostToDateColumn,
  LaborCostToDateReport,
  LaborCostToDateRow,
} from '@payroll/stores/reports-store';

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatMoney(value: number | string | null | undefined): number {
  return Number(value ?? 0);
}

function cellValue(row: LaborCostToDateRow, column: LaborCostToDateColumn): string | number {
  if (column.key === 'employeeCode') {
    return row.employeeCode ?? '';
  }
  if (column.key === 'employeeName') {
    return row.employeeName;
  }
  if (column.key === 'departments') {
    return row.departments;
  }

  const value = row.values[column.key] ?? null;
  if (column.type === 'date') {
    return value ? formatDate(String(value)) : '';
  }
  if (column.type === 'money' || column.type === 'number') {
    return formatMoney(value);
  }

  return value == null ? '' : String(value);
}

export function exportLaborCostToDateExcel(
  report: LaborCostToDateReport,
  columns: LaborCostToDateColumn[],
): void {
  const header = columns.map((column) => column.label);
  const dataRows = report.rows.map((row) => columns.map((column) => cellValue(row, column)));
  const totalsRow = columns.map((column) => {
    if (column.key === 'employeeName') {
      return 'Totals';
    }
    if (column.type === 'money' || column.type === 'number') {
      return report.totals[column.key] ?? 0;
    }

    return '';
  });

  const sheet = XLSX.utils.aoa_to_sheet([
    ['Labor Cost to Date'],
    [report.scopeLabel],
    [`${formatDate(report.startDate)} - ${formatDate(report.endDate)}`],
    [],
    header,
    ...dataRows,
    [],
    totalsRow,
  ]);
  sheet['!cols'] = columns.map((column) => ({
    wch: column.key === 'employeeName' || column.key === 'departments' ? 28 : 16,
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Labor cost to date');
  const filename = sanitizeFilename(
    `labor-cost-to-date-${report.startDate}-to-${report.endDate}`,
  );
  void saveReportWorkbook(workbook, `${filename || 'labor-cost-to-date'}.xlsx`);
}

export function exportLaborCostToDatePdf(
  report: LaborCostToDateReport,
  columns: LaborCostToDateColumn[],
): boolean {
  const header = columns.map((column) => column.label);
  const dataRows = report.rows.map((row) => columns.map((column) => cellValue(row, column)));
  const totalsRow = columns.map((column) => {
    if (column.key === 'employeeName') {
      return 'Totals';
    }
    if (column.type === 'money' || column.type === 'number') {
      return report.totals[column.key] ?? 0;
    }
    return '';
  });

  return openPrintableReport({
    title: 'Labor Cost to Date',
    lines: [report.scopeLabel, `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`],
    sections: [{ rows: [header, ...dataRows, totalsRow] }],
  });
}
