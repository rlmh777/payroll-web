import type { Td4SupplementaryReport, Td4SupplementarySlip } from '@payroll/stores/reports-store';
import { documentHeaderHtml } from '@payroll/utils/save-report-workbook';

const SLIP_CSS = `
.td4s-slip {
  width: 148mm;
  height: 105mm;
  box-sizing: border-box;
  padding: 3.2mm 4mm 2.4mm;
  background: #fff;
  color: #111;
  font-family: "Times New Roman", Times, serif;
  overflow: hidden;
  page-break-after: always;
  break-after: page;
}
.td4s-head {
  display: grid;
  grid-template-columns: 16mm 1fr 18mm;
  align-items: start;
}
.td4s-crest {
  width: 13.5mm;
  height: 13.5mm;
  object-fit: contain;
}
.td4s-titles {
  text-align: center;
  font-weight: 700;
  line-height: 1.12;
  padding-top: 0.4mm;
}
.td4s-dotted {
  display: inline-block;
  border: 1px dotted #222;
  padding: 0.2mm 1.8mm 0.5mm;
  font-size: 8pt;
  margin-bottom: 0.5mm;
}
.td4s-purpose,
.td4s-formno {
  font-size: 7.7pt;
}
.td4s-banner {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  font-weight: 700;
  font-size: 9.5pt;
  margin: 0.6mm 0.4mm 3.4mm;
}
.td4s-identity {
  display: grid;
  grid-template-columns: 1.18fr 1.22fr 0.7fr;
  gap: 2mm;
  align-items: stretch;
}
.td4s-addr,
.td4s-field {
  position: relative;
  border: 1.35px solid #111;
  border-radius: 8px;
  background: #fff;
}
.td4s-addr {
  min-height: 25.5mm;
  padding: 2.4mm 2.6mm 1.5mm;
  display: flex;
  flex-direction: column;
  font-size: 7.5pt;
  line-height: 1.25;
}
.td4s-addr-lines { margin-top: auto; }
.td4s-tins {
  display: flex;
  flex-direction: column;
  gap: 2.4mm;
}
.td4s-field {
  min-height: 12mm;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.2mm 1mm 0.6mm;
}
.td4s-tin { flex: 1; }
.td4s-label {
  position: absolute;
  top: -1.6mm;
  left: 2.2mm;
  background: #fff;
  padding: 0 0.7mm;
  font-size: 5.55pt;
  line-height: 1;
  font-weight: 700;
  text-decoration: underline;
  text-underline-offset: 0.35mm;
  color: #8d2f2a;
  white-space: nowrap;
}
.td4s-value {
  font-size: 8pt;
  line-height: 1;
  text-align: center;
}
.td4s-amounts,
.td4s-lower {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  column-gap: 2mm;
  margin-top: 3.6mm;
}
.td4s-lower { margin-top: 3.2mm; }
.td4s-e { grid-column: 2; }
.td4s-f { grid-column: 3; }
.td4s-g { grid-column: 4; }
.td4s-note {
  margin: 2.4mm 0 0;
  text-align: center;
  font-size: 6.3pt;
}
`;

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function money(value: number): string {
  return (Number(value) || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function field(label: string, value: string, extraClass = ''): string {
  return `<div class="td4s-field ${extraClass}"><div class="td4s-label">${escapeHtml(label)}</div><div class="td4s-value">${escapeHtml(value)}</div></div>`;
}

function addressBox(label: string, name: string, lines: string[]): string {
  const body = lines.map((line) => `<div>${escapeHtml(line)}</div>`).join('');
  return `<div class="td4s-addr"><div class="td4s-label">${escapeHtml(label)}</div><div>${escapeHtml(name)}</div><div class="td4s-addr-lines">${body}</div></div>`;
}

function slipMarkup(report: Td4SupplementaryReport, slip: Td4SupplementarySlip, crestUrl: string): string {
  const nonTaxable = Math.abs(slip.nonTaxableIncome) < 0.005 ? '' : money(slip.nonTaxableIncome);
  return `<article class="td4s-slip">
    <div class="td4s-head">
      <img class="td4s-crest" src="${escapeHtml(crestUrl)}" alt="" />
      <div class="td4s-titles">
        <div class="td4s-dotted">Statement of Emoluments Paid</div>
        <div class="td4s-purpose">FOR INCOME TAX PURPOSES</div>
        <div class="td4s-formno">TD-4 SUPPLEMENTARY -- ${report.year}</div>
      </div>
      <div></div>
    </div>
    <div class="td4s-banner"><span>BELIZE</span><span>FOR EMPLOYEE</span></div>
    <div class="td4s-identity">
      ${addressBox('Employee, Name and Address', slip.employeeName, slip.addressLines)}
      ${addressBox('Employer, Name and Address', report.employer.name, report.employer.addressLines)}
      <div class="td4s-tins">
        ${field('(H) Employer TIN', report.employer.tin, 'td4s-tin')}
        ${field('(I) Employee TIN', slip.employeeTin, 'td4s-tin')}
      </div>
    </div>
    <div class="td4s-amounts">
      ${field('(A) Social Security', slip.socialSecurity)}
      ${field('(B) No. of Weeks', String(slip.weeks))}
      ${field('(C) Total Income from Employment', money(slip.totalIncome))}
      ${field('(D) Total Taxable Income', money(slip.taxableIncome))}
    </div>
    <div class="td4s-lower">
      ${field('(E) Non-Taxable Income', nonTaxable, 'td4s-e')}
      ${field('(F) Commissions', money(slip.commissions), 'td4s-f')}
      ${field('(G) Tax Deducted at Source', money(slip.taxDeducted), 'td4s-g')}
    </div>
    <p class="td4s-note">Note that the Commissions should be included in Total Emoluments and Taxable Emoluments</p>
  </article>`;
}

export function td4SupplementaryMarkup(report: Td4SupplementaryReport): string {
  const crestUrl = `${window.location.origin}/belize-coat-of-arms.png`;
  const slips = report.slips.map((slip) => slipMarkup(report, slip, crestUrl)).join('');
  return `<style>${SLIP_CSS}.td4s-slip{margin:0 auto 6mm;box-shadow:0 2px 8px rgba(0,0,0,.16);}</style>${slips}`;
}

export function printTd4Supplementary(report: Td4SupplementaryReport): boolean {
  const crestUrl = `${window.location.origin}/belize-coat-of-arms.png`;
  const slips = report.slips.map((slip) => slipMarkup(report, slip, crestUrl)).join('');
  const header = documentHeaderHtml({
    title: `TD-4 Supplementary ${report.year}`,
    period: report.periodLabel,
  });
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>TD-4 Supplementary ${report.year}</title><style>
    ${SLIP_CSS}
    @page { size: A6 landscape; margin: 0; }
    html, body { margin: 0; padding: 0; background: #fff; }
    .td4s-slip { margin: 0; box-shadow: none; }
  </style></head><body>${header}${slips}</body></html>`;
  const popup = window.open('', '_blank', 'noopener,noreferrer');
  if (!popup) return false;
  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  const print = () => {
    popup.focus();
    popup.print();
  };
  if (popup.document.readyState === 'complete') {
    window.setTimeout(print, 250);
  } else {
    popup.addEventListener('load', () => window.setTimeout(print, 250));
  }
  return true;
}
