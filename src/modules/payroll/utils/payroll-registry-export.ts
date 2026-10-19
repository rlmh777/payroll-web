import * as XLSX from 'xlsx';
import { documentHeaderHtml, saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import type {
  PayrollRegistryAmounts,
  PayrollRegistryEmployee,
  PayrollRegistryReport,
} from '@payroll/stores/reports-store';

const AMOUNT_KEYS: (keyof PayrollRegistryAmounts)[] = [
  'regularHours',
  'regularPay',
  'overtimeHours',
  'overtimePay',
  'doubleTimeHours',
  'doubleTimePay',
  'miscPayments',
  'grossPay',
  'miscDeduction',
  'tax',
  'employeeSocialSecurity',
  'netPay',
  'employerSocialSecurity',
  'employerContribution',
];

const MONEY_KEYS = new Set<keyof PayrollRegistryAmounts>([
  'regularPay',
  'overtimePay',
  'doubleTimePay',
  'miscPayments',
  'grossPay',
  'miscDeduction',
  'tax',
  'employeeSocialSecurity',
  'netPay',
  'employerSocialSecurity',
  'employerContribution',
]);

function sanitizeFilename(value: string): string {
  return value.trim().replace(/[^\w.-]+/g, '_').replace(/_+/g, '_').replace(/^_+|_+$/g, '');
}

function amountValues(amounts: PayrollRegistryAmounts): number[] {
  return AMOUNT_KEYS.map((key) => Number(amounts[key] ?? 0));
}

function headerRows(): { groupRow: string[]; columnRow: string[]; merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] } {
  const groupRow = [
    'Proc. Date',
    'Period',
    'Payroll #',
    'Regular',
    '',
    'Overtime',
    '',
    'Double Time',
    '',
    'Misc. Payments',
    'Gross Pay',
    'Misc. Deduction',
    'Tax',
    'Employee Soc. Sec.',
    'Net Pay',
    'Employer Soc. Sec.',
    'Employer Contr.',
  ];
  const columnRow = [
    '',
    '',
    '',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    'Hours',
    'Pay',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
  ];
  const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] = [
    { s: { r: 4, c: 0 }, e: { r: 5, c: 0 } },
    { s: { r: 4, c: 1 }, e: { r: 5, c: 1 } },
    { s: { r: 4, c: 2 }, e: { r: 5, c: 2 } },
    { s: { r: 4, c: 3 }, e: { r: 4, c: 4 } },
    { s: { r: 4, c: 5 }, e: { r: 4, c: 6 } },
    { s: { r: 4, c: 7 }, e: { r: 4, c: 8 } },
  ];
  for (let column = 9; column <= 16; column += 1) {
    merges.push({ s: { r: 4, c: column }, e: { r: 5, c: column } });
  }
  return { groupRow, columnRow, merges };
}

export function exportPayrollRegistryExcel(
  report: PayrollRegistryReport,
  employees: PayrollRegistryEmployee[],
  grouped: boolean,
): void {
  const headers = headerRows();
  const rows: (string | number)[][] = [
    [report.company.name],
    [report.company.lines.join(', ')],
    [report.title],
    [report.periodLabel],
    headers.groupRow,
    headers.columnRow,
  ];

  const pushAmounts = (lead: (string | number)[], amounts: PayrollRegistryAmounts) => {
    rows.push([...lead, ...amountValues(amounts)]);
  };

  let lastDepartment = '';
  employees.forEach((employee) => {
    if (grouped && employee.departmentName !== lastDepartment) {
      rows.push([employee.departmentName]);
      lastDepartment = employee.departmentName;
    }
    rows.push([employee.displayName]);
    employee.years.forEach((year) => {
      rows.push([String(year.year)]);
      year.lines.forEach((line) => {
        pushAmounts(
          [line.processedDateLabel, line.period, line.payrollNumber],
          line,
        );
      });
      pushAmounts([String(year.year), year.payrollCount, ''], year.totals);
    });
    pushAmounts(['', '', ''], employee.totals);
  });
  pushAmounts(['TOTAL', '', ''], report.totals);

  const sheet = XLSX.utils.aoa_to_sheet(rows);
  const width = headers.groupRow.length;
  sheet['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: width - 1 } },
    { s: { r: 1, c: 0 }, e: { r: 1, c: width - 1 } },
    { s: { r: 2, c: 0 }, e: { r: 2, c: width - 1 } },
    { s: { r: 3, c: 0 }, e: { r: 3, c: width - 1 } },
    ...headers.merges,
  ];
  sheet['!cols'] = headers.groupRow.map((label) => ({ wch: Math.max(12, label.length + 2) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Payroll registry');
  const filename = sanitizeFilename(`payroll-registry-${report.startDate}-to-${report.endDate}`);
  void saveReportWorkbook(workbook, `${filename || 'payroll-registry'}.xlsx`, {
    title: report.title,
    period: report.periodLabel,
  });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatAmount(key: keyof PayrollRegistryAmounts, value: number): string {
  if (MONEY_KEYS.has(key)) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
  }
  return Number(value || 0).toFixed(2);
}

function amountCells(amounts: PayrollRegistryAmounts): string {
  return AMOUNT_KEYS.map((key) => `<td class="num">${formatAmount(key, Number(amounts[key] ?? 0))}</td>`).join('');
}

export function exportPayrollRegistryPdf(
  report: PayrollRegistryReport,
  employees: PayrollRegistryEmployee[],
  grouped: boolean,
): boolean {
  const body: string[] = [];
  let lastDepartment = '';
  employees.forEach((employee) => {
    if (grouped && employee.departmentName !== lastDepartment) {
      body.push(`<tr class="dept"><td colspan="17">${escapeHtml(employee.departmentName)}</td></tr>`);
      lastDepartment = employee.departmentName;
    }
    body.push(`<tr class="name"><td colspan="17">${escapeHtml(employee.displayName)}</td></tr>`);
    employee.years.forEach((year) => {
      body.push(`<tr class="year"><td colspan="17">${year.year}</td></tr>`);
      year.lines.forEach((line) => {
        body.push(
          `<tr><td>${escapeHtml(line.processedDateLabel)}</td><td class="num">${line.period}</td><td class="num">${line.payrollNumber}</td>${amountCells(line)}</tr>`,
        );
      });
      body.push(
        `<tr class="subtotal"><td>${year.year}</td><td class="num">${year.payrollCount}</td><td></td>${amountCells(year.totals)}</tr>`,
      );
    });
    body.push(`<tr class="employee-total"><td></td><td></td><td></td>${amountCells(employee.totals)}</tr>`);
  });
  body.push(`<tr class="grand"><td>TOTAL</td><td></td><td></td>${amountCells(report.totals)}</tr>`);

  const address = report.company.lines.map((line) => escapeHtml(line)).join('<br>');
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { size: landscape; margin: 0.4in; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #222; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    h1 { font-size: 18px; margin: 0; }
    p { margin: 2px 0; }
    table { width: 100%; border-collapse: collapse; }
    th, td { border: 1px solid #bfbfbf; padding: 3px 4px; }
    th { background: #f3f3f3; text-align: center; }
    td.num, th.num { text-align: right; }
    tr.name td { background: #efe4c6; font-weight: 700; }
    tr.dept td { background: #e8eef6; font-weight: 700; }
    tr.year td { font-weight: 700; }
    tr.subtotal td { background: #f7f7f7; }
    tr.employee-total td { background: #d9e8f6; font-weight: 700; }
    tr.grand td { background: #ececec; font-weight: 700; }
  </style>
</head>
<body>
  ${documentHeaderHtml({ title: report.title, period: report.periodLabel })}
  <div class="head">
    <div>
      <strong>${escapeHtml(report.company.name)}</strong>
      <p>${address}</p>
    </div>
    <div>
      <h1>${escapeHtml(report.title)}</h1>
      <p>${escapeHtml(report.periodLabel)}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr>
        <th rowspan="2">Proc. Date</th>
        <th rowspan="2">Period</th>
        <th rowspan="2">Payroll #</th>
        <th colspan="2">Regular</th>
        <th colspan="2">Overtime</th>
        <th colspan="2">Double Time</th>
        <th rowspan="2">Misc. Payments</th>
        <th rowspan="2">Gross Pay</th>
        <th rowspan="2">Misc. Deduction</th>
        <th rowspan="2">Tax</th>
        <th rowspan="2">Employee Soc. Sec.</th>
        <th rowspan="2">Net Pay</th>
        <th rowspan="2">Employer Soc. Sec.</th>
        <th rowspan="2">Employer Contr.</th>
      </tr>
      <tr>
        <th>Hours</th><th>Pay</th>
        <th>Hours</th><th>Pay</th>
        <th>Hours</th><th>Pay</th>
      </tr>
    </thead>
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
