import * as XLSX from 'xlsx';
import { documentHeaderHtml, saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import type {
  SalaryPaymentsColumn,
  SalaryPaymentsReport,
  SalaryPaymentsRow,
} from '@payroll/stores/reports-store';

export interface SalaryPaymentsDepartmentView {
  departmentId: number | null;
  departmentName: string;
  rows: SalaryPaymentsRow[];
  totals: Record<string, number>;
}

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

export function cellValue(row: SalaryPaymentsRow, column: SalaryPaymentsColumn): string | number {
  const value = row.values[column.key];
  if (column.type === 'text' || column.type === 'date') {
    return value == null ? '' : String(value);
  }
  return money(typeof value === 'number' ? value : Number(value ?? 0));
}

function headerRows(columns: SalaryPaymentsColumn[]): {
  groupRow: string[];
  columnRow: string[];
  merges: { s: { r: number; c: number }; e: { r: number; c: number } }[];
} {
  const groupRow = ['Employee Name'];
  const columnRow = [''];
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [];
  let index = 1;
  let cursor = 0;
  while (cursor < columns.length) {
    const column = columns[cursor];
    if (!column?.group) {
      groupRow.push(column?.label ?? '');
      columnRow.push('');
      merges.push({ s: { r: 3, c: index }, e: { r: 4, c: index } });
      index += 1;
      cursor += 1;
      continue;
    }
    const group = column.group;
    const members = [];
    while (cursor < columns.length && columns[cursor]?.group === group) {
      members.push(columns[cursor]);
      cursor += 1;
    }
    groupRow.push(group, ...Array(Math.max(0, members.length - 1)).fill(''));
    members.forEach((member) => columnRow.push(member?.label ?? ''));
    if (members.length > 1) {
      merges.push({ s: { r: 3, c: index }, e: { r: 3, c: index + members.length - 1 } });
    }
    index += members.length;
  }

  return { groupRow, columnRow, merges };
}

function rowValues(row: SalaryPaymentsRow, columns: SalaryPaymentsColumn[]): (string | number)[] {
  return [row.displayName, ...columns.map((column) => cellValue(row, column))];
}

function totalsValues(label: string, totals: Record<string, number>, columns: SalaryPaymentsColumn[]): (string | number)[] {
  return [
    label,
    ...columns.map((column) => (column.total ? money(totals[column.key]) : '')),
  ];
}

export function exportSalaryPaymentsExcel(
  report: SalaryPaymentsReport,
  columns: SalaryPaymentsColumn[],
  departments: SalaryPaymentsDepartmentView[],
  flatRows: SalaryPaymentsRow[] | null,
  totals: Record<string, number>,
): void {
  const headers = headerRows(columns);
  const rows: (string | number)[][] = [
    [report.title],
    [`Payments for Period: ${report.startDate} to ${report.endDate}`],
    [report.scopeLabel],
    headers.groupRow,
    headers.columnRow,
  ];

  if (flatRows) {
    flatRows.forEach((row) => rows.push(rowValues(row, columns)));
  } else {
    departments.forEach((department) => {
      rows.push([department.departmentName]);
      department.rows.forEach((row) => rows.push(rowValues(row, columns)));
      rows.push(totalsValues(`${department.departmentName} total`, department.totals, columns));
      rows.push([]);
    });
  }
  rows.push(totalsValues('TOTAL', totals, columns));

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const width = Math.max(1, headers.groupRow.length);
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: width - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: width - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: width - 1 } },
    ...headers.merges,
  ];
  sheet['!cols'] = headers.groupRow.map((label) => ({
    wch: Math.min(28, Math.max(12, label.length + 2)),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Salary payments');
  const filename = sanitizeFilename(`salary-payments-${report.startDate}-to-${report.endDate}`);
  void saveReportWorkbook(workbook, `${filename || 'salary-payments'}.xlsx`, {
    title: report.title,
    period: `${report.startDate} - ${report.endDate}`,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCell(column: SalaryPaymentsColumn, value: string | number): string {
  if (column.type === 'text' || column.type === 'date') {
    return escapeHtml(String(value ?? ''));
  }
  if (column.type === 'hours' || column.type === 'number') {
    return Number(value ?? 0).toFixed(2);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value ?? 0));
}

export function exportSalaryPaymentsPdf(
  report: SalaryPaymentsReport,
  columns: SalaryPaymentsColumn[],
  departments: SalaryPaymentsDepartmentView[],
  flatRows: SalaryPaymentsRow[] | null,
  totals: Record<string, number>,
): boolean {
  const header = columns
    .map((column) => {
      const label = column.group ? `${column.group} ${column.label}` : column.label;
      return `<th>${escapeHtml(label)}</th>`;
    })
    .join('');

  const body: string[] = [];
  const pushRow = (row: SalaryPaymentsRow) => {
    body.push(
      `<tr><td>${escapeHtml(row.displayName)}</td>${columns
        .map((column) => `<td class="num">${formatCell(column, cellValue(row, column))}</td>`)
        .join('')}</tr>`,
    );
  };
  const pushTotals = (label: string, rowTotals: Record<string, number>, className: string) => {
    body.push(
      `<tr class="${className}"><td>${escapeHtml(label)}</td>${columns
        .map((column) => `<td class="num">${column.total ? formatCell(column, money(rowTotals[column.key])) : ''}</td>`)
        .join('')}</tr>`,
    );
  };

  if (flatRows) {
    flatRows.forEach(pushRow);
  } else {
    departments.forEach((department) => {
      body.push(`<tr class="dept"><td colspan="${columns.length + 1}">${escapeHtml(department.departmentName)}</td></tr>`);
      department.rows.forEach(pushRow);
      pushTotals(`${department.departmentName} total`, department.totals, 'subtotal');
    });
  }
  pushTotals('TOTAL', totals, 'total');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { size: landscape; margin: 0.4in; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #222; }
    h1 { font-size: 16px; margin: 0 0 4px; }
    p { margin: 0 0 12px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #ccc; padding: 3px 5px; white-space: nowrap; }
    th { background: #f3f3f3; }
    td.num, th.num { text-align: right; }
    tr.dept td { background: #e8eef6; font-weight: 700; }
    tr.subtotal td { background: #f7f7f7; font-weight: 700; }
    tr.total td { background: #ececec; font-weight: 700; }
  </style>
</head>
<body>
  ${documentHeaderHtml({ title: report.title, period: `${report.startDate} to ${report.endDate}` })}
  <h1>${escapeHtml(report.title)}</h1>
  <p>Payments for Period: ${escapeHtml(report.startDate)} to ${escapeHtml(report.endDate)} · ${escapeHtml(report.scopeLabel)} · ${report.employeeCount} employees</p>
  <table>
    <thead><tr><th>Employee Name</th>${header}</tr></thead>
    <tbody>${body.join('')}</tbody>
  </table>
</body>
</html>`;

  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) {
    return false;
  }
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
  popup.print();
  return true;
}
