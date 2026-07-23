import ExcelJS from 'exceljs';
import type { PayeEmploymentDetailsReport } from '@payroll/stores/reports-store';

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function formatCurrencyDisplay(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

async function loadTemplate(): Promise<ExcelJS.Workbook> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/paye-employment-details.xlsx`);
  if (!response.ok) {
    throw new Error('Unable to load the PAYE Employment Details Excel template.');
  }

  const buffer = await response.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

function buildExportFilename(report: PayeEmploymentDetailsReport): string {
  const periodPart = report.month
    ? sanitizeFilename(report.period)
    : 'January-December';
  return `PAYE_Employment_Details_${report.year}_${periodPart}.xlsx`;
}

export function formatPayeCurrency(value: number): string {
  return formatCurrencyDisplay(value);
}

export async function exportPayeEmploymentDetailsExcel(
  report: PayeEmploymentDetailsReport,
): Promise<void> {
  const workbook = await loadTemplate();
  const worksheet = workbook.getWorksheet('Employee Details');
  if (!worksheet) {
    throw new Error('PAYE template is missing the Employee Details sheet.');
  }

  worksheet.getCell('C8').value = report.submitter.tin || null;
  worksheet.getCell('C10').value = report.submitter.name || null;
  worksheet.getCell('C12').value = report.submitter.address || null;
  worksheet.getCell('C14').value = report.year;
  worksheet.getCell('C16').value = report.period;

  worksheet.getCell('G22').value = report.totals.totalEmoluments;
  worksheet.getCell('H22').value = report.totals.taxableBenefits;
  worksheet.getCell('I22').value = report.totals.commissions;
  worksheet.getCell('J22').value = report.totals.taxWithheld;

  const dataStartRow = 25;
  report.rows.forEach((row, index) => {
    const excelRow = dataStartRow + index;
    worksheet.getCell(excelRow, 2).value = row.tin || null;
    worksheet.getCell(excelRow, 3).value = row.taxpayerName || null;
    worksheet.getCell(excelRow, 4).value = row.socialSecurityNumber || null;
    worksheet.getCell(excelRow, 5).value = row.passport || null;
    worksheet.getCell(excelRow, 6).value = row.numberOfWeeksEmployed;
    worksheet.getCell(excelRow, 7).value = row.totalEmoluments;
    worksheet.getCell(excelRow, 8).value = row.taxableBenefits;
    worksheet.getCell(excelRow, 9).value = row.commissions;
    worksheet.getCell(excelRow, 10).value = row.taxWithheld;
  });

  // Clear leftover template rows beyond generated data.
  const clearThrough = Math.max(worksheet.rowCount, dataStartRow + report.rows.length + 50);
  for (let rowNumber = dataStartRow + report.rows.length; rowNumber <= clearThrough; rowNumber += 1) {
    for (let col = 2; col <= 10; col += 1) {
      worksheet.getCell(rowNumber, col).value = null;
    }
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = buildExportFilename(report);
  anchor.click();
  URL.revokeObjectURL(url);
}
