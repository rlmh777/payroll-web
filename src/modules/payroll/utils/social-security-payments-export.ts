import { saveReportWorkbook } from '@payroll/utils/save-report-workbook';
import * as XLSX from 'xlsx';
import type { SocialSecurityPaymentsByMonthReport } from '@payroll/stores/reports-store';
import { openPrintableReport } from '@payroll/utils/printable-report';

const HEADERS = [
  'Employee SS#',
  'Company SS#',
  'Year',
  'Month',
  'Week',
  'Weekly Gross',
  'SS Amount',
  'Electronic Employer #',
  'Date Hired',
  'First Name',
  'Last Name',
];

function rows(report: SocialSecurityPaymentsByMonthReport): (string | number)[][] {
  return report.rows.map((row) => [
    row.employeeSocialSecurityNumber ?? '',
    row.companySocialSecurityNumber ?? '',
    row.year,
    row.monthName,
    row.calendarWeek,
    row.weeklyGrossPay,
    row.socialSecurityAmount,
    row.electronicEmployerNumber ?? '',
    row.dateHired ?? '',
    row.firstName ?? '',
    row.lastName ?? '',
  ]);
}

export function exportSocialSecurityPaymentsExcel(report: SocialSecurityPaymentsByMonthReport): void {
  const sheet = XLSX.utils.aoa_to_sheet([
    ['Social Security Payments by Month'],
    [`${report.monthName} ${report.year}`],
    [],
    HEADERS,
    ...rows(report),
    ['TOTAL', '', '', '', report.totals.rowCount, report.totals.weeklyGrossPay, report.totals.socialSecurityAmount],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'Social security');
  void saveReportWorkbook(workbook, `social-security-payments-${report.year}-${String(report.month).padStart(2, '0')}.xlsx`);
}

export function exportSocialSecurityPaymentsPdf(report: SocialSecurityPaymentsByMonthReport): boolean {
  return openPrintableReport({
    title: 'Social Security Payments by Month',
    lines: [`${report.monthName} ${report.year}`],
    sections: [{
      rows: [
        HEADERS,
        ...rows(report),
        ['TOTAL', '', '', '', report.totals.rowCount, report.totals.weeklyGrossPay, report.totals.socialSecurityAmount],
      ],
    }],
  });
}
