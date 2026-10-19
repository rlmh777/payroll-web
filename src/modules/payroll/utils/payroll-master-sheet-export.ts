import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import { openPrintableReport } from '@payroll/utils/printable-report';
import type {
  PayrollMasterSheetEarningColumn,
  PayrollMasterSheetEarningValue,
  PayrollMasterSheetEmployeeRow,
  PayrollMasterSheetMonth,
  PayrollMasterSheetReport,
  PayrollMasterSheetTotals,
} from '@payroll/stores/reports-store';

const TRAILING = [
  'Total # of Hrs',
  'working $ total',
  'Grat PT',
  'Grat % worked',
  'Grat $ payout',
  'Gross Salary',
  'Total Gross per Hr',
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

function earningCells(
  earnings: Record<string, PayrollMasterSheetEarningValue> | undefined,
  columns: PayrollMasterSheetEarningColumn[],
): number[] {
  return columns.flatMap((column) => [
    money(earnings?.[column.key]?.hours),
    money(earnings?.[column.key]?.amount),
  ]);
}

function employeeRow(
  row: PayrollMasterSheetEmployeeRow,
  columns: PayrollMasterSheetEarningColumn[],
): (string | number)[] {
  return [
    row.employeeName,
    row.jobDescription,
    money(row.hourlyBase),
    ...earningCells(row.earnings, columns),
    money(row.totalHours),
    money(row.workingTotal),
    money(row.gratuityPoints),
    money(row.gratuityPercentWorked),
    money(row.gratuityPayout),
    money(row.grossSalary),
    money(row.totalGrossPerHour),
  ];
}

function totalsRow(
  label: string,
  totals: PayrollMasterSheetTotals,
  columns: PayrollMasterSheetEarningColumn[],
): (string | number)[] {
  return [
    label,
    '',
    '',
    ...earningCells(totals.earnings, columns),
    money(totals.totalHours),
    money(totals.workingTotal),
    money(totals.gratuityPoints),
    '',
    money(totals.gratuityPayout),
    money(totals.grossSalary),
    money(totals.totalGrossPerHour),
  ];
}

function uniqueSheetName(name: string, used: Set<string>): string {
  let candidate = name.slice(0, 31) || 'Month';
  let suffix = 2;
  while (used.has(candidate)) {
    const extra = ` (${suffix})`;
    candidate = `${name.slice(0, Math.max(1, 31 - extra.length))}${extra}`;
    suffix += 1;
  }
  used.add(candidate);
  return candidate;
}

function monthRows(
  month: PayrollMasterSheetMonth,
  columns: PayrollMasterSheetEarningColumn[],
): (string | number)[][] {
  const groupRow: (string | number)[] = ['Employee Name', 'Job Description', 'Hourly base'];
  const columnRow: (string | number)[] = ['', '', ''];
  columns.forEach((column) => {
    groupRow.push(column.name, '');
    columnRow.push('Hrs', 'Pay');
  });
  groupRow.push(...TRAILING);
  columnRow.push(...TRAILING.map(() => ''));

  const width = groupRow.length;
  const rateRow: (string | number)[] = Array(width).fill('');
  const gratuityColumn = 3 + columns.length * 2 + 4;
  rateRow[gratuityColumn] = money(month.gratuityRate);

  const rows: (string | number)[][] = [
    [month.companyName],
    [month.label],
    [],
    groupRow,
    columnRow,
    rateRow,
  ];

  for (const department of month.departments) {
    rows.push([department.departmentName]);
    for (const row of department.rows) {
      rows.push(employeeRow(row, columns));
    }
    rows.push(totalsRow(`${department.departmentName} total`, department.totals, columns));
    rows.push([]);
  }

  rows.push(totalsRow('TOTAL', month.totals, columns));
  return rows;
}

function monthSheet(
  month: PayrollMasterSheetMonth,
  columns: PayrollMasterSheetEarningColumn[],
): XLSX.WorkSheet {
  const rows = monthRows(month, columns);
  const width = rows[3]?.length ?? 1;
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(0, width - 1) } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: Math.max(0, width - 1) } },
  ];
  columns.forEach((_, index) => {
    const start = 3 + index * 2;
    merges.push({ s: { r: 3, c: start }, e: { r: 3, c: start + 1 } });
  });
  sheet['!merges'] = merges;
  sheet['!cols'] = (rows[3] ?? []).map((label) => ({
    wch: Math.min(28, Math.max(12, String(label).length + 2)),
  }));

  return sheet;
}

export function exportPayrollMasterSheetExcel(report: PayrollMasterSheetReport): void {
  const workbook = XLSX.utils.book_new();
  const usedNames = new Set<string>();
  const columns = report.earningColumns ?? [];
  const sheetNames = report.months.map((month) =>
    report.months.filter((item) => item.sheetName === month.sheetName).length > 1
      ? `${month.sheetName} ${month.year}`
      : month.sheetName,
  );

  report.months.forEach((month, index) => {
    XLSX.utils.book_append_sheet(
      workbook,
      monthSheet(month, columns),
      uniqueSheetName(sheetNames[index] ?? month.sheetName, usedNames),
    );
  });

  const first = report.months[0];
  const last = report.months[report.months.length - 1];
  const filename = sanitizeFilename(
    first && last
      ? `payroll-master-sheet-${first.year}-${String(first.month).padStart(2, '0')}-to-${last.year}-${String(last.month).padStart(2, '0')}`
      : 'payroll-master-sheet',
  );
  void saveReportWorkbook(workbook, `${filename || 'payroll-master-sheet'}.xlsx`);
}

export function exportPayrollMasterSheetPdf(report: PayrollMasterSheetReport): boolean {
  const columns = report.earningColumns ?? [];
  return openPrintableReport({
    title: report.title || 'Payroll Master Sheet',
    lines: [report.companyName, report.scopeLabel],
    sections: report.months.map((month) => ({
      heading: month.label,
      rows: monthRows(month, columns),
      headerRowCount: 0,
    })),
  });
}
