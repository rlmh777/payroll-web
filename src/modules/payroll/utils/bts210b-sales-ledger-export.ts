import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export type Bts210bExportRow = {
  date: string | number;
  invoice_no: string;
  name: string;
  tin: string;
  standard_rated: number;
  zero_rated: number;
  exempt: number;
  total_supplies: number;
  gst_payable: number;
  debit_credit_notes: number;
  gob_contracts: number;
  gst_withheld_gob: number;
};

export type Bts210bExportOptions = {
  rows: Bts210bExportRow[];
  year: number;
  month: number;
  companyTin: string;
  companyName: string;
  exportedAt?: Date;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DATA_START_ROW = 9;
const MONEY_COLUMNS = [5, 6, 7, 8, 9, 10, 11, 12];
const MONEY_FORMAT = '#,##0.00';
const DATE_FORMAT = 'dd/mm/yyyy';

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function monthLabel(month: number): string {
  return MONTH_NAMES[month - 1] ?? String(month);
}

function taxPeriodLabel(year: number, month: number): string {
  return `${monthLabel(month).slice(0, 3)}-${String(year).slice(-2)}`;
}

function formatExportDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function toExcelDate(value: string | number): number | string {
  if (value === '' || value == null) return '';
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 20000 && numeric < 80000) {
    return Math.round(numeric);
  }
  return String(value);
}

function moneyOrEmpty(value: number): number | undefined {
  return Number.isFinite(value) && value !== 0 ? Number(value) : undefined;
}

function applyMoneyCell(cell: ExcelJS.Cell, value: number | undefined) {
  if (value == null) {
    cell.value = '';
  } else {
    cell.value = value;
  }
  cell.numFmt = MONEY_FORMAT;
}

/**
 * Excel Tables / autoFilter in the BTS template make ExcelJS throw
 * when rewriting cells (filterButton on missing table columns).
 * Strip those parts from the xlsx zip before load and after write.
 */
async function stripExcelTablesFromXlsx(buffer: ArrayBuffer | ExcelJS.Buffer): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(buffer);

  Object.keys(zip.files).forEach((name) => {
    if (
      name.startsWith('xl/tables/')
      || name.includes('printerSettings')
      || name.startsWith('docMetadata/')
    ) {
      zip.remove(name);
    }
  });

  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    const contentTypes = await contentTypesFile.async('string');
    zip.file(
      '[Content_Types].xml',
      contentTypes
        .replace(/<Override[^>]*PartName="\/xl\/tables\/[^"]+"[^>]*\/>/g, '')
        .replace(/<Override[^>]*PartName="\/docMetadata\/[^"]+"[^>]*\/>/g, '')
        .replace(/<Default Extension="bin"[^>]*\/>/g, ''),
    );
  }

  await Promise.all(
    Object.keys(zip.files)
      .filter((name) => name.startsWith('xl/worksheets/_rels/'))
      .map(async (name) => {
        const file = zip.file(name);
        if (!file) return;
        const xml = await file.async('string');
        zip.file(
          name,
          xml
            .replace(/<Relationship[^>]*Type="[^"]*\/table"[^>]*\/>/g, '')
            .replace(/<Relationship[^>]*Type="[^"]*\/printerSettings"[^>]*\/>/g, ''),
        );
      }),
  );

  await Promise.all(
    Object.keys(zip.files)
      .filter((name) => /^xl\/worksheets\/[^/]+\.xml$/.test(name))
      .map(async (name) => {
        const file = zip.file(name);
        if (!file) return;
        const xml = await file.async('string');
        zip.file(
          name,
          xml
            .replace(/<tableParts[\s\S]*?<\/tableParts>/g, '')
            .replace(/<autoFilter[\s\S]*?<\/autoFilter>/g, '')
            .replace(/<autoFilter\b[^>]*\/>/g, '')
            .replace(/(<pageSetup\b[^>]*?)\s+r:id="[^"]*"/g, '$1'),
        );
      }),
  );

  return zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
  });
}

async function loadTemplate(): Promise<ExcelJS.Workbook> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/bts210b-sales-ledger.xlsx`);
  if (!response.ok) {
    throw new Error('Unable to load the BTS210b sales ledger template.');
  }

  const rawBuffer = await response.arrayBuffer();
  const sanitizedBuffer = await stripExcelTablesFromXlsx(rawBuffer);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(sanitizedBuffer);
  return workbook;
}

function buildExportFilename(year: number, month: number): string {
  const period = `${year}-${String(month).padStart(2, '0')}`;
  return `BTS210b_Sales_Ledger_${sanitizeFilename(period)}.xlsx`;
}

function downloadWorkbook(buffer: ArrayBuffer, filename: string) {
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function clearDataRows(worksheet: ExcelJS.Worksheet, startRow: number, endRow: number) {
  for (let rowNumber = startRow; rowNumber <= endRow; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    for (let col = 1; col <= 12; col += 1) {
      row.getCell(col).value = null;
    }
  }
}

export async function exportBts210bSalesLedger(options: Bts210bExportOptions): Promise<void> {
  const workbook = await loadTemplate();
  const worksheet = workbook.getWorksheet('Sales Ledger') ?? workbook.worksheets[0];
  if (!worksheet) {
    throw new Error('BTS210b template is missing the sales ledger sheet.');
  }

  const lastTemplateRow = Math.max(worksheet.rowCount, DATA_START_ROW);
  const lastDataRow = DATA_START_ROW + options.rows.length;
  clearDataRows(worksheet, DATA_START_ROW, Math.max(lastTemplateRow, lastDataRow));

  const exportedAt = options.exportedAt ?? new Date();
  worksheet.getCell('A4').value = options.companyTin || '';
  worksheet.getCell('D4').value = options.companyName || '';
  worksheet.getCell('J4').value = taxPeriodLabel(options.year, options.month);
  worksheet.getCell('L2').value = `Date: ${formatExportDate(exportedAt)}`;

  const totals = {
    standard_rated: 0,
    zero_rated: 0,
    exempt: 0,
    total_supplies: 0,
    gst_payable: 0,
    debit_credit_notes: 0,
    gob_contracts: 0,
    gst_withheld_gob: 0,
  };

  options.rows.forEach((row, index) => {
    const excelRow = DATA_START_ROW + index;
    const sheetRow = worksheet.getRow(excelRow);
    const dateCell = sheetRow.getCell(1);
    const dateValue = toExcelDate(row.date);
    dateCell.value = dateValue === '' ? '' : dateValue;
    dateCell.numFmt = DATE_FORMAT;

    sheetRow.getCell(2).value = row.invoice_no || '';
    sheetRow.getCell(3).value = row.name || '';
    sheetRow.getCell(4).value = row.tin || '';
    applyMoneyCell(sheetRow.getCell(5), moneyOrEmpty(row.standard_rated));
    applyMoneyCell(sheetRow.getCell(6), moneyOrEmpty(row.zero_rated));
    applyMoneyCell(sheetRow.getCell(7), moneyOrEmpty(row.exempt));
    applyMoneyCell(sheetRow.getCell(8), Number(row.total_supplies ?? 0));
    applyMoneyCell(sheetRow.getCell(9), moneyOrEmpty(row.gst_payable));
    applyMoneyCell(sheetRow.getCell(10), moneyOrEmpty(row.debit_credit_notes));
    applyMoneyCell(sheetRow.getCell(11), moneyOrEmpty(row.gob_contracts));
    applyMoneyCell(sheetRow.getCell(12), moneyOrEmpty(row.gst_withheld_gob));

    totals.standard_rated += Number(row.standard_rated ?? 0);
    totals.zero_rated += Number(row.zero_rated ?? 0);
    totals.exempt += Number(row.exempt ?? 0);
    totals.total_supplies += Number(row.total_supplies ?? 0);
    totals.gst_payable += Number(row.gst_payable ?? 0);
    totals.debit_credit_notes += Number(row.debit_credit_notes ?? 0);
    totals.gob_contracts += Number(row.gob_contracts ?? 0);
    totals.gst_withheld_gob += Number(row.gst_withheld_gob ?? 0);
  });

  const totalRowNumber = DATA_START_ROW + options.rows.length;
  const totalRow = worksheet.getRow(totalRowNumber);
  totalRow.getCell(1).value = 'TOTAL';
  totalRow.getCell(1).font = { bold: true };
  applyMoneyCell(totalRow.getCell(5), totals.standard_rated);
  applyMoneyCell(totalRow.getCell(6), totals.zero_rated);
  applyMoneyCell(totalRow.getCell(7), totals.exempt);
  applyMoneyCell(totalRow.getCell(8), totals.total_supplies);
  applyMoneyCell(totalRow.getCell(9), totals.gst_payable);
  applyMoneyCell(totalRow.getCell(10), totals.debit_credit_notes);
  applyMoneyCell(totalRow.getCell(11), totals.gob_contracts);
  applyMoneyCell(totalRow.getCell(12), totals.gst_withheld_gob);
  MONEY_COLUMNS.forEach((column) => {
    totalRow.getCell(column).font = { bold: true };
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const sanitized = await stripExcelTablesFromXlsx(buffer);
  downloadWorkbook(sanitized, buildExportFilename(options.year, options.month));
}
