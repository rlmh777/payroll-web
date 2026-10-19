import { documentHeaderHtml, saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import type {
  SocialSecurityContributionsReport,
  SocialSecurityContributionsRow,
} from '@payroll/stores/reports-store';

const HEADERS = [
  'Last Name',
  'First Name',
  'Social Security Number',
  'Week No.',
  'Weekly Earnings',
  'Employee Contr.',
  'Employer Contr.',
  'Total Contribution',
];

function money(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function dataCells(row: SocialSecurityContributionsRow): (string | number)[] {
  return [
    row.lastName,
    row.firstName,
    row.socialSecurityNumber,
    row.weekNumber,
    Number(row.weeklyEarnings || 0),
    Number(row.employeeContribution || 0),
    Number(row.employerContribution || 0),
    Number(row.totalContribution || 0),
  ];
}

export function exportSocialSecurityContributionsExcel(report: SocialSecurityContributionsReport): void {
  const sheetRows: (string | number)[][] = [
    [report.generatedAt, '', '', '', '', report.title],
    ['', '', '', '', '', 'Year/Month', report.yearLabel, report.monthLabel],
    ['Organization', report.organization],
    [],
    HEADERS,
  ];

  report.groups.forEach((group) => {
    sheetRows.push([group.name]);
    group.rows.forEach((row) => sheetRows.push(dataCells(row)));
  });

  sheetRows.push([
    'Total',
    '',
    '',
    report.totals.rowCount,
    Number(report.totals.weeklyEarnings || 0),
    Number(report.totals.employeeContribution || 0),
    Number(report.totals.employerContribution || 0),
    Number(report.totals.totalContribution || 0),
  ]);

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet['!cols'] = HEADERS.map((label, index) => ({ wch: index < 3 ? 24 : Math.max(14, label.length + 2) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'SS Contributions');
  void saveReportWorkbook(workbook, `social-security-contributions-${report.startDate}-to-${report.endDate}.xlsx`, {
    title: report.title,
    period: `${report.monthLabel} ${report.yearLabel}`,
  });
}

export function exportSocialSecurityContributionsPdf(report: SocialSecurityContributionsReport): boolean {
  const header = documentHeaderHtml({
    title: report.title,
    period: `${report.monthLabel} ${report.yearLabel}`,
  });
  const body = report.groups.map((group) => {
    const rows = group.rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.lastName)}</td>
        <td>${escapeHtml(row.firstName)}</td>
        <td>${escapeHtml(row.socialSecurityNumber)}</td>
        <td class="center">${row.weekNumber}</td>
        <td class="num">${money(row.weeklyEarnings)}</td>
        <td class="num">${money(row.employeeContribution)}</td>
        <td class="num">${money(row.employerContribution)}</td>
        <td class="num">${money(row.totalContribution)}</td>
      </tr>`).join('');
    return `<tr class="group"><td colspan="8">${escapeHtml(group.name)}</td></tr>${rows}`;
  }).join('');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(report.title)}</title>
  <style>
    @page { size: landscape; margin: 0.4in; }
    body { font-family: "Times New Roman", Times, serif; color: #222; font-size: 11px; }
    h1 { text-align: center; font-size: 18px; margin: 0 0 8px; }
    .meta { width: 100%; margin-bottom: 8px; }
    .meta td { border: none; padding: 1px 4px; }
    table.grid { width: 100%; border-collapse: collapse; }
    table.grid th, table.grid td { border: 1px solid #c00000; padding: 2px 4px; }
    table.grid th { text-align: center; }
    td.num { text-align: right; }
    td.center, th.center { text-align: center; }
    tr.group td { background: #e6d7b8; font-weight: 700; }
    tr.total td { font-weight: 700; }
  </style>
</head>
<body>
  ${header}
  <table class="meta">
    <tr>
      <td>${escapeHtml(report.generatedAt)}</td>
      <td></td>
      <td style="text-align:right">Year/Month</td>
      <td><strong>${escapeHtml(report.yearLabel)}</strong></td>
      <td><strong>${escapeHtml(report.monthLabel)}</strong></td>
    </tr>
    <tr>
      <td colspan="5"><strong>Organization</strong> &nbsp; ${escapeHtml(report.organization)}</td>
    </tr>
  </table>
  <h1>${escapeHtml(report.title)}</h1>
  <table class="grid">
    <thead>
      <tr>${HEADERS.map((label) => `<th>${label}</th>`).join('')}</tr>
    </thead>
    <tbody>
      ${body}
      <tr class="total">
        <td>Total</td><td></td><td></td>
        <td class="center">${report.totals.rowCount}</td>
        <td class="num">${money(report.totals.weeklyEarnings)}</td>
        <td class="num">${money(report.totals.employeeContribution)}</td>
        <td class="num">${money(report.totals.employerContribution)}</td>
        <td class="num">${money(report.totals.totalContribution)}</td>
      </tr>
    </tbody>
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
