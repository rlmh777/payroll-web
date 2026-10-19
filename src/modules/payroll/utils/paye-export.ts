import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import type { PayeReport, PayeRow } from '@payroll/stores/reports-store';
import { openPrintableReport } from '@payroll/utils/printable-report';

const HEADERS = [
  'Employee',
  'Department',
  'TIN',
  'Social Security',
  'Weeks',
  'Taxable Gross',
  'Emoluments',
  'Commissions',
  'PAYE Withheld',
];

function money(value: number): number {
  return Number(value ?? 0);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function dataRow(row: PayeRow): (string | number)[] {
  return [
    row.displayName,
    row.departmentName,
    row.tin,
    row.socialSecurityNumber,
    row.weeksEmployed,
    money(row.taxableGross),
    money(row.totalEmoluments),
    money(row.commissions),
    money(row.taxWithheld),
  ];
}

function totalsRow(report: PayeReport): (string | number)[] {
  return [
    'TOTAL',
    '',
    '',
    '',
    report.totals.weeksEmployed,
    money(report.totals.taxableGross),
    money(report.totals.totalEmoluments),
    money(report.totals.commissions),
    money(report.totals.taxWithheld),
  ];
}

function printableRow(row: (string | number)[]): (string | number)[] {
  return row.map((cell, index) => (index >= 5 && typeof cell === 'number' ? formatMoney(cell) : cell));
}

export function exportPayeExcel(report: PayeReport): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [report.company.name],
    ...report.company.lines.map((line) => [line]),
    [report.title],
    [report.periodLabel],
    [report.scopeLabel],
    [],
    HEADERS,
    ...report.rows.map((row) => dataRow(row)),
    totalsRow(report),
  ]);
  sheet['!cols'] = HEADERS.map((label, index) => ({ wch: index < 2 ? 24 : Math.max(14, label.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'PAYE');
  void saveReportWorkbook(workbook, `paye-${report.startDate}-to-${report.endDate}.xlsx`);
}

export function exportPayePdf(report: PayeReport): boolean {
  return openPrintableReport({
    title: report.title,
    lines: [report.company.name, ...report.company.lines, report.periodLabel, report.scopeLabel],
    sections: [
      {
        rows: [
          HEADERS,
          ...report.rows.map((row) => printableRow(dataRow(row))),
          printableRow(totalsRow(report)),
        ],
      },
    ],
  });
}
