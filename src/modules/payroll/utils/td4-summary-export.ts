import * as XLSX from 'xlsx';
import type { Td4SummaryReport } from '@payroll/stores/reports-store';
import { documentHeaderHtml, saveReportWorkbook } from '@payroll/utils/save-report-workbook';

const CERTIFICATE = 'I HEREBY CERTIFY that the information given in this return, TD4 Summary and related TD4 Supplementary forms, is true, correct and complete.';

function amount(value: number): string {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function crestDataUrl(): Promise<string> {
  return fetch('/belize-coat-of-arms.png')
    .then((response) => (response.ok ? response.blob() : Promise.reject(new Error('crest'))))
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        resolve(typeof result === 'string' ? result : '');
      };
      reader.onerror = () => reject(new Error('crest'));
      reader.readAsDataURL(blob);
    }))
    .catch(() => '');
}

export function exportTd4SummaryExcel(report: Td4SummaryReport): void {
  const sheetRows: (string | number)[][] = [
    ['TD4 Summary'],
    ['Return of Emoluments Paid'],
    [report.yearEndingLabel],
    [],
    ['Name and Address of Employer', '', '', 'TAX ID No.'],
    [report.employerName, '', '', report.taxIdentificationNumber],
    ...report.addressLines.map((line) => [line]),
    [],
    ['EMOLUMENTS PAID, (as shown on forms TD4 Supplementary)', amount(report.emolumentsPaid)],
    ['CASUAL WAGES PAID, (amount under $200 from which no tax was deducted)', amount(report.casualWagesPaid)],
    ['TOTAL EMOLUMENTS PAID IN THE YEAR', amount(report.totalEmoluments)],
    ['TOTAL INCOME TAX WITHHELD', amount(report.incomeTaxWithheld)],
    [],
    ['CERTIFICATE'],
    [CERTIFICATE],
    [],
    [report.generatedAt, '', ''],
    ['Date', 'Signature of Authorized Person', 'Position or Office'],
    [],
    ['See instructions in the "Employer\'s and Trustee\'s Tax Guide".'],
    ['Mail or deliver 1 copy of this Summary along with copies 1 and 2 of all related Supplementaries to the Income Tax Department or deliver to the nearest District Office.'],
    [],
    ['FOR OFFICIAL USE ONLY'],
    ['POST:'],
  ];

  const sheet = XLSX.utils.aoa_to_sheet(sheetRows);
  sheet['!cols'] = [{ wch: 78 }, { wch: 28 }, { wch: 36 }, { wch: 18 }];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, 'TD4 Summary');
  void saveReportWorkbook(workbook, `td4-summary-${report.year}.xlsx`, {
    title: 'TD4 Summary',
    period: report.yearEndingLabel,
  });
}

export function exportTd4SummaryPdf(report: Td4SummaryReport): Promise<boolean> {
  return crestDataUrl().then((crest) => {
    const address = [report.employerName, ...report.addressLines]
      .map((line) => `<div>${escapeHtml(line)}</div>`)
      .join('');
    const crestHtml = crest ? `<img class="crest" src="${crest}" alt="" />` : '';
    const header = documentHeaderHtml({ title: 'TD4 Summary', period: report.yearEndingLabel });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>TD4 Summary ${report.year}</title>
  <style>
    body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 28px auto; max-width: 820px; }
    .crest { display: block; width: 92px; height: auto; margin: 0 auto 8px; }
    h1, h2, .year { text-align: center; margin: 0; }
    h1 { font-size: 20px; margin-top: 8px; }
    h2 { font-size: 16px; font-weight: 700; }
    .year { margin: 4px 0 22px; font-weight: 700; }
    .identity { display: flex; justify-content: space-between; gap: 24px; align-items: flex-start; }
    .box { border: 1.5px solid #222; border-radius: 16px; padding: 10px 16px; }
    .employer { width: 62%; min-height: 92px; }
    .employer .label, .tax .label { font-size: 12px; margin-bottom: 6px; }
    .tax { width: 180px; text-align: center; }
    .tax strong { display: block; margin-top: 8px; letter-spacing: 0.04em; }
    table.amounts { width: 100%; border-collapse: collapse; margin: 28px 0; }
    table.amounts td { padding: 7px 0; font-weight: 700; }
    table.amounts td.num { text-align: right; width: 180px; font-variant-numeric: tabular-nums; }
    .certificate { min-height: 120px; margin-top: 8px; }
    .certificate h3 { text-align: center; margin: 8px 0 18px; }
    .certificate p { margin: 0 8px 12px; line-height: 1.45; }
    .signs { display: grid; grid-template-columns: 1fr 1.3fr 1fr; gap: 28px; margin-top: 28px; }
    .signs .line { border-bottom: 1px solid #222; min-height: 28px; text-align: center; padding-bottom: 2px; }
    .signs .caption { text-align: center; font-size: 12px; margin-top: 4px; }
    .foot { display: flex; justify-content: space-between; gap: 24px; margin-top: 28px; align-items: flex-start; }
    .instructions { font-size: 13px; max-width: 430px; line-height: 1.4; }
    .official { width: 250px; min-height: 110px; }
    .official h3 { text-align: center; margin: 4px 0 28px; font-size: 14px; }
  </style>
</head>
<body>
  ${header}
  ${crestHtml}
  <h1>TD4 Summary</h1>
  <h2>Return of Emoluments Paid</h2>
  <div class="year">${escapeHtml(report.yearEndingLabel)}</div>
  <div class="identity">
    <div class="box employer">
      <div class="label">Name and Address of Employer</div>
      ${address}
    </div>
    <div class="box tax">
      <div class="label">TAX ID No.</div>
      <strong>${escapeHtml(report.taxIdentificationNumber)}</strong>
    </div>
  </div>
  <table class="amounts">
    <tr><td>EMOLUMENTS PAID, <span style="font-weight:400">(as shown on forms TD4 Supplementary)</span></td><td class="num">${amount(report.emolumentsPaid)}</td></tr>
    <tr><td>CASUAL WAGES PAID, <span style="font-weight:400">(amount under $200 from which no tax was deducted)</span></td><td class="num">${amount(report.casualWagesPaid)}</td></tr>
    <tr><td>TOTAL EMOLUMENTS PAID IN THE YEAR</td><td class="num">${amount(report.totalEmoluments)}</td></tr>
    <tr><td>TOTAL INCOME TAX WITHHELD</td><td class="num">${amount(report.incomeTaxWithheld)}</td></tr>
  </table>
  <div class="box certificate">
    <h3>CERTIFICATE</h3>
    <p>${escapeHtml(CERTIFICATE)}</p>
  </div>
  <div class="signs">
    <div><div class="line">${escapeHtml(report.generatedAt)}</div><div class="caption">Date</div></div>
    <div><div class="line"></div><div class="caption">Signature of Authorized Person</div></div>
    <div><div class="line"></div><div class="caption">Position or Office</div></div>
  </div>
  <div class="foot">
    <div class="instructions">
      <p>See instructions in the "Employer's and Trustee's Tax Guide".</p>
      <p>Mail or deliver 1 copy of this Summary along with copies 1 and 2 of all related Supplementaries to the Income Tax Department or deliver to the nearest District Office.</p>
    </div>
    <div class="box official">
      <h3>FOR OFFICIAL USE ONLY</h3>
      <div>POST: ____________________</div>
    </div>
  </div>
</body>
</html>`;
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) return false;
    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();
    popup.print();
    return true;
  });
}
