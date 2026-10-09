import * as XLSX from 'xlsx';
import type { TaxCalculatorResults } from '@payroll/stores/tax-calculator-store';

export interface GstCalculatorPartialExemptionExport {
  gst_income: number;
  zero_rated_income: number;
  exempt_income: number;
  total_value: number;
  gst_income_ratio: number;
  exempt_ratio: number;
  complement_ratio: number;
  ratio_check: number;
  partial_exemptions_total: number;
  ratio_times_partial_exemptions: number;
  total_debits: number;
  less_partial_exemptions: number;
  line_250: number;
  gst_rate: number;
  gst_due_before_exemptions: number;
  invoices_less_exemptions: number;
  net_gst_due: number;
  net_of_2251: number;
  additional_liability: number;
}

export interface GstCalculatorResultsExport {
  periodLabel: string;
  year: number;
  month: number;
  partialExemption: GstCalculatorPartialExemptionExport;
  results: TaxCalculatorResults | null;
  rateName: (code: string) => string;
}

type SheetRow = Array<string | number>;

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function percentLabel(value: number): string {
  return `${(Number(value ?? 0) * 100).toFixed(2)}%`;
}

function moneyNote(left: number, right: number): string {
  return `${left.toFixed(2)} ÷ ${right.toFixed(2)}`;
}

function appendSheet(
  workbook: XLSX.WorkBook,
  name: string,
  rows: SheetRow[],
  colWidths: number[],
) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = colWidths.map((wch) => ({ wch }));
  XLSX.utils.book_append_sheet(workbook, worksheet, name);
}

function buildPartialExemptionSheet(input: GstCalculatorResultsExport): SheetRow[] {
  const pe = input.partialExemption;
  return [
    ['Partial Exemption Method Calculations: GST'],
    ['Period', input.periodLabel],
    [],
    ['Description', 'Amount', 'Note'],
    [
      'Total Income from GST 12.5% column:',
      pe.gst_income,
      `${percentLabel(pe.gst_income_ratio)} of taxable + exempt`,
    ],
    [
      'Zero rated Income GST column:',
      pe.zero_rated_income,
      'Excluded from ratio (0% GST)',
    ],
    [
      'Exempt',
      pe.exempt_income,
      `${percentLabel(pe.exempt_ratio)} of taxable + exempt`,
    ],
    [
      'Total Value of Taxable & Exempt:',
      pe.total_value,
      `${percentLabel(pe.ratio_check)} (taxable + exempt shares; zero rated excluded)`,
    ],
    [
      'Ratio of Taxable to Total Value of both Taxable & Exempt',
      percentLabel(pe.gst_income_ratio),
      moneyNote(pe.gst_income, pe.total_value),
    ],
    [
      'Complement ratio (1 − taxable ratio)',
      percentLabel(pe.complement_ratio),
      'Taxes:Taxable and Taxes:Partial are GST-exclusive. Partial and its GST are split by this ratio.',
    ],
    [
      'Total Partial Exemptions (see 2251 tab)',
      pe.partial_exemptions_total,
      'Input tax that is neither directly related to Exempt (Zero Rated) or Taxable',
    ],
    [
      'Ratio % x Partial Exemptions Total',
      pe.ratio_times_partial_exemptions,
      'Deduct from GST Ledger Line 250',
    ],
    ['Total Debits on 2251', pe.total_debits, 'Total entered from Invoices'],
    ['Less Partial Exemptions Total', pe.less_partial_exemptions, ''],
    ['', pe.line_250, 'Line 250 (Total from invoices minus EXEMPTIONS %)'],
    ['Total Income from GST 12.5% column:', pe.gst_income, ''],
    ['GST rate', percentLabel(pe.gst_rate), ''],
    ['Total GST due BEFORE Exemptions are applied:', pe.gst_due_before_exemptions, ''],
    ['', pe.invoices_less_exemptions, 'Total from Invoices less allowed Exemptions'],
    ['NET GST DUE FOR THIS MONTH:', pe.net_gst_due, ''],
    ['Net of 2251 account', pe.net_of_2251, ''],
    ['Additional liability charged to rooms', pe.additional_liability, ''],
  ];
}

function buildBusinessTaxSheet(input: GstCalculatorResultsExport): SheetRow[] {
  const results = input.results;
  const rows: SheetRow[] = [
    ['Business tax (IRIS)'],
    ['Period', input.periodLabel],
    [],
    ['Description', 'Amount', 'Tax'],
  ];

  if (!results) {
    rows.push(['No IRIS results yet. Enter amounts and save, or wait for recalculation.']);
    return rows;
  }

  const tax = results.business_tax;
  rows.push(['Line 10 — Income', tax.iris.line_10, tax.income_tax]);
  rows.push(['Line 20 — Professional services', tax.iris.line_20, tax.professional_services_tax]);
  rows.push(['Line 120 — Tour operator', tax.iris.line_120, tax.tour_operator_tax]);
  rows.push(['Line 110 — Dividend', tax.iris.line_110, tax.dividend_tax]);
  for (const custom of tax.custom ?? []) {
    rows.push([input.rateName(custom.code), custom.amount, custom.tax]);
  }
  rows.push(['Total business tax', '', tax.total_tax]);
  return rows;
}

function buildGstSheet(input: GstCalculatorResultsExport): SheetRow[] {
  const results = input.results;
  const rows: SheetRow[] = [
    ['GST (IRIS)'],
    ['Period', input.periodLabel],
    [],
    ['Description', 'Amount'],
  ];

  if (!results) {
    rows.push(['No IRIS results yet. Enter amounts and save, or wait for recalculation.']);
    return rows;
  }

  const gst = results.gst;
  rows.push(['Line 100 — Total incomes', gst.line_100]);
  rows.push(['Line 110 — Zero income', gst.line_110]);
  rows.push(['Line 120 — Exempt income', gst.line_120]);
  rows.push(['Line 130 — Total', gst.line_130]);
  rows.push(['Line 140 — GST on total income', gst.line_140]);
  rows.push(['Line 210', gst.line_210]);
  rows.push(['Line 220', gst.line_220]);
  rows.push(['Line 230', gst.line_230]);
  rows.push(['Line 250 — GST paid on domestic taxable supplies', gst.line_250]);
  rows.push(['Line 300 — Tax payable for this tax period', gst.line_300]);
  rows.push(['Line 360 — Tax due for this period', gst.line_360]);
  return rows;
}

function buildBtbSheet(input: GstCalculatorResultsExport): SheetRow[] {
  const results = input.results;
  const rows: SheetRow[] = [
    ['BTB hotel tax'],
    ['Period', input.periodLabel],
    [],
    ['Description', 'Amount'],
  ];

  if (!results) {
    rows.push(['No IRIS results yet. Enter amounts and save, or wait for recalculation.']);
    return rows;
  }

  rows.push(['Base', results.btb.base]);
  rows.push(['BTB tax', results.btb.tax]);
  rows.push([]);
  rows.push(['Total this month (business tax + GST due + BTB)', results.combined_total]);
  return rows;
}

export function exportGstCalculatorResultsExcel(input: GstCalculatorResultsExport): void {
  const workbook = XLSX.utils.book_new();
  appendSheet(workbook, 'Partial Exemption', buildPartialExemptionSheet(input), [62, 18, 72]);
  appendSheet(workbook, 'Business Tax', buildBusinessTaxSheet(input), [42, 16, 16]);
  appendSheet(workbook, 'GST', buildGstSheet(input), [52, 16]);
  appendSheet(workbook, 'BTB', buildBtbSheet(input), [58, 16]);

  const period = sanitizeFilename(input.periodLabel) || `${input.year}_${String(input.month).padStart(2, '0')}`;
  XLSX.writeFile(workbook, `gst-calculator-results_${period}.xlsx`);
}
