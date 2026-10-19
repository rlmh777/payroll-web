import * as XLSX from 'xlsx';
import { formatDate } from '../components/attendance/utils';
import type { BankUploadReport } from '@payroll/stores/reports-store';
import { openPrintableReport } from '@payroll/utils/printable-report';
import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';

const HEADERS = ['Type', 'Code', 'Branch', 'Bank account', 'Employee', 'Net pay', 'Payroll #'];

function period(report: BankUploadReport): string {
  if (!report.payPeriodStartDate || !report.payPeriodEndDate) {
    return '';
  }
  return `${formatDate(report.payPeriodStartDate)} - ${formatDate(report.payPeriodEndDate)}`;
}

function rows(report: BankUploadReport): (string | number)[][] {
  return report.rows.map((row) => [
    row.transactionType,
    row.paymentType,
    row.branchNumber,
    row.accountNumber,
    row.employeeName,
    row.netPay,
    row.payrollNumberLabel,
  ]);
}

export function exportBankUploadExcel(report: BankUploadReport): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    [report.companyName ?? ''],
    [report.generatedOn ?? '', '', report.totals.rowCount, report.totals.netPay],
    [],
    [],
    ...report.rows.map((row) => [
      row.transactionType,
      row.paymentType,
      row.branchNumber,
      row.default1,
      row.default2,
      row.default3,
      row.accountNumber,
      row.employeeName,
      row.netPay,
    ]),
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Bank upload');
  void saveReportWorkbook(workbook, `bank-upload-${report.payrollNumberFormatted}.xlsx`, {
    title: 'Bank Upload',
    period: report.payrollNumberLabel,
  });
}

export function exportBankUploadPdf(report: BankUploadReport): boolean {
  return openPrintableReport({
    title: 'Bank Upload',
    lines: [report.payPeriodGroupName ?? '', period(report), report.payrollNumberLabel],
    sections: [{
      rows: [
        HEADERS,
        ...rows(report),
        ['TOTAL', '', '', '', report.totals.rowCount, report.totals.netPay, ''],
      ],
    }],
  });
}
