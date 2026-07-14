import * as XLSX from 'xlsx';
import { formatDate } from '../components/attendance/utils';
import type { JournalEntryReport } from '@payroll/stores/reports-store';

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function buildExportFilename(report: JournalEntryReport, extension: string): string {
  const groupName = sanitizeFilename(report.payPeriodGroupName ?? 'payroll');
  const startDate = sanitizeFilename(formatDate(report.payPeriodStartDate));
  const endDate = sanitizeFilename(formatDate(report.payPeriodEndDate));

  return `journal-entries_${groupName}_${startDate}_to_${endDate}.${extension}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatDateRange(report: JournalEntryReport): string {
  return `${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function exportJournalEntriesExcel(report: JournalEntryReport): void {
  const rows: Array<Array<string | number>> = [
    ['Journal Entries Report'],
    ['Pay period group', report.payPeriodGroupName ?? '—'],
    ['Pay period date range', formatDateRange(report)],
    ['Pay period number', report.payPeriodNumber],
    [],
    ['Account number', 'Account description', 'Debit', 'Credit'],
    ...report.rows.map((row) => [
      row.accountNumber,
      row.accountDescription,
      row.debit,
      row.credit,
    ]),
    [],
    ['Totals', '', report.totals.debit, report.totals.credit],
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = [
    { wch: 18 },
    { wch: 36 },
    { wch: 14 },
    { wch: 14 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Journal Entries');
  XLSX.writeFile(workbook, buildExportFilename(report, 'xlsx'));
}

function buildJournalEntriesPrintHtml(report: JournalEntryReport): string {
  const tableRows = report.rows
    .map((row) => `
      <tr>
        <td>${escapeHtml(row.accountNumber)}</td>
        <td>${escapeHtml(row.accountDescription)}</td>
        <td class="amount">${formatCurrency(row.debit)}</td>
        <td class="amount">${formatCurrency(row.credit)}</td>
      </tr>
    `)
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Journal Entries Report</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #111;
        margin: 24px;
      }

      h1 {
        font-size: 22px;
        margin: 0 0 8px;
      }

      .meta {
        margin-bottom: 20px;
        font-size: 13px;
        line-height: 1.6;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      th,
      td {
        border: 1px solid #ccc;
        padding: 8px 10px;
        text-align: left;
      }

      th {
        background: #f5f5f5;
        font-weight: 700;
      }

      td.amount,
      th.amount {
        text-align: right;
        white-space: nowrap;
      }

      tfoot td {
        font-weight: 700;
        background: #fafafa;
      }

      .toolbar {
        margin-bottom: 16px;
      }

      .toolbar button {
        padding: 8px 14px;
        font-size: 13px;
        cursor: pointer;
      }

      @media print {
        .toolbar {
          display: none;
        }

        body {
          margin: 12px;
        }
      }
    </style>
  </head>
  <body>
    <div class="toolbar">
      <button type="button" onclick="window.print()">Print / Save as PDF</button>
    </div>

    <h1>Journal Entries Report</h1>
    <div class="meta">
      <div><strong>Pay period group:</strong> ${escapeHtml(report.payPeriodGroupName ?? '—')}</div>
      <div><strong>Pay period date range:</strong> ${escapeHtml(formatDateRange(report))}</div>
      <div><strong>Pay period number:</strong> ${report.payPeriodNumber}</div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Account number</th>
          <th>Account description</th>
          <th class="amount">Debit</th>
          <th class="amount">Credit</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" class="amount">Totals</td>
          <td class="amount">${formatCurrency(report.totals.debit)}</td>
          <td class="amount">${formatCurrency(report.totals.credit)}</td>
        </tr>
      </tfoot>
    </table>

    <script>
      window.addEventListener('load', function () {
        requestAnimationFrame(function () {
          window.print();
        });
      });
    </script>
  </body>
</html>`;
}

export function exportJournalEntriesPdf(report: JournalEntryReport): boolean {
  const exportWindow = window.open('', '_blank');

  if (!exportWindow) {
    return false;
  }

  exportWindow.document.open('text/html', 'replace');
  exportWindow.document.write(buildJournalEntriesPrintHtml(report));
  exportWindow.document.close();
  exportWindow.focus();

  return true;
}
