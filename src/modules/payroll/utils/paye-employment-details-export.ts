import JSZip from 'jszip';
import type { PayeEmploymentDetailsReport, PayeEmploymentDetailsRow } from '@payroll/stores/reports-store';
import { downloadXlsxBuffer } from '@payroll/utils/save-report-workbook';

const DATA_START_ROW = 25;
const TEMPLATE_LAST_ROW = 234;
const TABLE_LAST_ROW = 3025;
const FORMULA_BLOCK_START = 217;

const HEADER_CELLS = {
  tin: 'C8',
  name: 'C10',
  address: 'C12',
  year: 'C14',
  period: 'C16',
} as const;

const DATA_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;

function sanitizeFilename(value: string): string {
  return value
    .trim()
    .replace(/[^\w.-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function xmlNumber(value: number): string {
  const rounded = Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function textCell(ref: string, style: string, value: string): string {
  const space = /^\s|\s$|\s{2}/.test(value) ? ' xml:space="preserve"' : '';
  return `<c r="${ref}"${style} t="inlineStr"><is><t${space}>${escapeXml(value)}</t></is></c>`;
}

function numberCell(ref: string, value: number): string {
  return `<c r="${ref}"><v>${xmlNumber(value)}</v></c>`;
}

function removeCell(xml: string, ref: string): string {
  return xml.replace(new RegExp(`<c r="${ref}"(?: [^>]*?)?(?:/>|>[\\s\\S]*?</c>)`), '');
}

function setStyledTextCell(sheet: string, ref: string, value: string): string {
  const pattern = new RegExp(`<c r="${ref}"([^>/]*?)(?:/>|>[\\s\\S]*?</c>)`);
  if (!pattern.test(sheet)) {
    throw new Error(`PAYE template is missing cell ${ref}.`);
  }

  return sheet.replace(pattern, (_match, attrs: string) => {
    const style = (attrs.match(/\ss="[^"]*"/) ?? [''])[0];
    return textCell(ref, style, value);
  });
}

function dataCells(rowNumber: number, row: PayeEmploymentDetailsRow): string {
  const cells = [
    textCell(`B${rowNumber}`, '', row.tin || ''),
    textCell(`C${rowNumber}`, '', row.taxpayerName || ''),
    textCell(`D${rowNumber}`, '', row.socialSecurityNumber || ''),
  ];

  if (row.passport) {
    cells.push(textCell(`E${rowNumber}`, '', row.passport));
  }

  cells.push(
    numberCell(`F${rowNumber}`, row.numberOfWeeksEmployed),
    numberCell(`G${rowNumber}`, row.totalEmoluments),
    numberCell(`H${rowNumber}`, row.taxableBenefits),
    numberCell(`I${rowNumber}`, row.commissions),
    numberCell(`J${rowNumber}`, row.taxWithheld),
  );

  return cells.join('');
}

function formulaCells(rowNumber: number): string {
  const shared = (column: string, index: number, calculate: boolean) => {
    const ca = calculate ? ' ca="1"' : '';
    return `<c r="${column}${rowNumber}" t="b"><f t="shared"${ca} si="${index}"/><v>0</v></c>`;
  };

  return [
    shared('M', 30, false),
    shared('N', 31, true),
    shared('O', 32, false),
    shared('P', 33, true),
    `<c r="Q${rowNumber}" t="b"><f>TRUE()</f><v>1</v></c>`,
    shared('R', 34, false),
    shared('S', 35, false),
    shared('T', 36, false),
    shared('U', 37, false),
    shared('V', 38, false),
    shared('X', 39, true),
  ].join('');
}

function patchExistingRow(rowXml: string, rowNumber: number, row: PayeEmploymentDetailsRow | null): string {
  let next = rowXml;
  DATA_COLUMNS.forEach((column) => {
    next = removeCell(next, `${column}${rowNumber}`);
  });

  if (!row) {
    return next;
  }

  return next.replace(/(<row\b[^>]*>)/, `$1${dataCells(rowNumber, row)}`);
}

function buildAddedRow(rowNumber: number, row: PayeEmploymentDetailsRow): string {
  return `<row r="${rowNumber}" spans="2:28" ht="15" x14ac:dyDescent="0.25">${dataCells(rowNumber, row)}${formulaCells(rowNumber)}</row>`;
}

function extendFormulaRefs(sheet: string, lastRow: number): string {
  if (lastRow <= TEMPLATE_LAST_ROW) {
    return sheet;
  }

  return sheet.replace(
    /ref="([A-Z]+)217:(\1)(\d+)"/g,
    (_match, column: string, _same: string, end: string) => {
      const currentEnd = Number(end);
      const nextEnd = Math.max(currentEnd, lastRow);
      return `ref="${column}${FORMULA_BLOCK_START}:${column}${nextEnd}"`;
    },
  );
}

export function fillPayeEmployeeDetailsSheet(
  sheetXml: string,
  report: PayeEmploymentDetailsReport,
): string {
  if (report.rows.length > TABLE_LAST_ROW - DATA_START_ROW + 1) {
    throw new Error('PAYE Employee Details supports at most 3,001 employees in one workbook.');
  }

  let sheet = sheetXml;
  sheet = setStyledTextCell(sheet, HEADER_CELLS.tin, report.submitter.tin || '');
  sheet = setStyledTextCell(sheet, HEADER_CELLS.name, report.submitter.name || '');
  sheet = setStyledTextCell(sheet, HEADER_CELLS.address, report.submitter.address || '');
  sheet = setStyledTextCell(sheet, HEADER_CELLS.year, String(report.year));
  sheet = setStyledTextCell(sheet, HEADER_CELLS.period, report.period);

  const lastDataRow = DATA_START_ROW + Math.max(report.rows.length, 1) - 1;
  const sheetLastRow = Math.max(TEMPLATE_LAST_ROW, lastDataRow);

  for (let rowNumber = DATA_START_ROW; rowNumber <= TEMPLATE_LAST_ROW; rowNumber += 1) {
    const row = report.rows[rowNumber - DATA_START_ROW] ?? null;
    const pattern = new RegExp(`<row r="${rowNumber}"[^>]*>[\\s\\S]*?</row>`);
    if (!pattern.test(sheet)) {
      throw new Error(`PAYE template is missing employee row ${rowNumber}.`);
    }
    sheet = sheet.replace(pattern, (rowXml) => patchExistingRow(rowXml, rowNumber, row));
  }

  if (lastDataRow > TEMPLATE_LAST_ROW) {
    const added = report.rows
      .slice(TEMPLATE_LAST_ROW - DATA_START_ROW + 1)
      .map((row, index) => buildAddedRow(TEMPLATE_LAST_ROW + 1 + index, row))
      .join('');
    sheet = sheet.replace('</sheetData>', `${added}</sheetData>`);
    sheet = extendFormulaRefs(sheet, lastDataRow);
    sheet = sheet.replace(
      /<dimension ref="([^"]+)"\/>/,
      `<dimension ref="B2:AB${sheetLastRow}"/>`,
    );
  }

  return sheet;
}

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/paye-employment-details.xlsx`);
  if (!response.ok) {
    throw new Error('Unable to load the PAYE employee details Excel template.');
  }

  return response.arrayBuffer();
}

function buildExportFilename(report: PayeEmploymentDetailsReport): string {
  return `PAYE_Employee_Details_${report.year}_${sanitizeFilename(report.period)}.xlsx`;
}

export async function buildPayeEmployeeDetailsWorkbook(
  template: ArrayBuffer,
  report: PayeEmploymentDetailsReport,
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(template);
  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
  const workbookFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  const contentTypesFile = zip.file('[Content_Types].xml');

  if (!sheetFile || !workbookFile || !relsFile || !contentTypesFile) {
    throw new Error('PAYE template is missing the Employee Details workbook parts.');
  }

  const sheet = await sheetFile.async('string');
  zip.file('xl/worksheets/sheet1.xml', fillPayeEmployeeDetailsSheet(sheet, report));

  let workbook = await workbookFile.async('string');
  if (workbook.includes('<calcPr')) {
    workbook = workbook.replace(/<calcPr\b([^>]*)\/>/, (_match, attrs: string) => {
      const without = attrs
        .replace(/\sfullCalcOnLoad="[^"]*"/, '')
        .replace(/\scalcMode="[^"]*"/, '');
      return `<calcPr${without} calcMode="auto" fullCalcOnLoad="1"/>`;
    });
  } else {
    workbook = workbook.replace('</workbook>', '<calcPr calcMode="auto" fullCalcOnLoad="1"/></workbook>');
  }
  zip.file('xl/workbook.xml', workbook);

  zip.remove('xl/calcChain.xml');
  zip.file(
    'xl/_rels/workbook.xml.rels',
    (await relsFile.async('string')).replace(/<Relationship[^>]*\/calcChain"[^>]*\/>/g, ''),
  );
  zip.file(
    '[Content_Types].xml',
    (await contentTypesFile.async('string')).replace(/<Override[^>]*calcChain\.xml"[^>]*\/>/g, ''),
  );

  return zip.generateAsync({ type: 'arraybuffer', compression: 'DEFLATE' });
}

export function formatPayeCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export async function exportPayeEmploymentDetailsExcel(
  report: PayeEmploymentDetailsReport,
): Promise<void> {
  const template = await loadTemplate();
  const buffer = await buildPayeEmployeeDetailsWorkbook(template, report);
  await downloadXlsxBuffer(buffer, buildExportFilename(report), {
    title: 'PAYE Employee Details',
    period: `${report.year} ${report.period}`,
  });
}
