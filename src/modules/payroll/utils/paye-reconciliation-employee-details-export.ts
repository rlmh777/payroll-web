import JSZip from 'jszip';
import { downloadXlsxBuffer } from '@payroll/utils/save-report-workbook';
import type {
  PayeEmploymentDetailsRow,
  PayeReconciliationEmployeeDetailsReport,
} from '@payroll/stores/reports-store';

const DATA_START_ROW = 25;
const TABLE_LAST_ROW = 3525;
const DATA_COLUMNS = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'] as const;
const PERIOD_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

const HEADER_CELLS = {
  tin: 'C8',
  name: 'C10',
  address: 'C12',
  period: 'C16',
} as const;

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

function cellStyle(attrs: string): string {
  return (attrs.match(/\ss="[^"]*"/) ?? [''])[0];
}

function setStyledTextCell(sheet: string, ref: string, value: string): string {
  const pattern = new RegExp(`<c r="${ref}"([^>/]*?)(?:/>|>[\\s\\S]*?</c>)`);
  if (!pattern.test(sheet)) {
    throw new Error(`PAYE reconciliation template is missing cell ${ref}.`);
  }

  return sheet.replace(pattern, (_match, attrs: string) => textCell(ref, cellStyle(attrs), value));
}

function setStyledNumberCell(sheet: string, ref: string, value: number): string {
  const pattern = new RegExp(`<c r="${ref}"([^>/]*?)(?:/>|>[\\s\\S]*?</c>)`);
  if (!pattern.test(sheet)) {
    throw new Error(`PAYE reconciliation template is missing cell ${ref}.`);
  }

  return sheet.replace(
    pattern,
    (_match, attrs: string) => `<c r="${ref}"${cellStyle(attrs)}><v>${xmlNumber(value)}</v></c>`,
  );
}

function dataCells(rowNumber: number, row: PayeEmploymentDetailsRow, styles: Record<string, string>): string {
  const textValue = (column: 'B' | 'C' | 'D' | 'E'): string => {
    if (column === 'B') return row.tin || '';
    if (column === 'C') return row.taxpayerName || '';
    if (column === 'D') return row.socialSecurityNumber || '';
    return row.passport || '';
  };

  const numberValue = (column: 'F' | 'G' | 'H' | 'I' | 'J'): number => {
    if (column === 'F') return row.numberOfWeeksEmployed;
    if (column === 'G') return row.totalEmoluments;
    if (column === 'H') return row.taxableBenefits;
    if (column === 'I') return row.commissions;
    return row.taxWithheld;
  };

  return DATA_COLUMNS.map((column) => {
    const ref = `${column}${rowNumber}`;
    const style = styles[column] ?? '';
    if (!row) {
      return `<c r="${ref}"${style}/>`;
    }
    if (column === 'B' || column === 'C' || column === 'D' || column === 'E') {
      const value = textValue(column);
      return value === '' ? `<c r="${ref}"${style}/>` : textCell(ref, style, value);
    }
    return `<c r="${ref}"${style}><v>${xmlNumber(numberValue(column))}</v></c>`;
  }).join('');
}

function patchDataRow(
  rowXml: string,
  rowNumber: number,
  row: PayeEmploymentDetailsRow | null,
): string {
  const styles: Record<string, string> = {};
  let next = rowXml;

  DATA_COLUMNS.forEach((column) => {
    const pattern = new RegExp(`<c r="${column}${rowNumber}"([^>/]*?)(?:/>|>[\\s\\S]*?</c>)`);
    next = next.replace(pattern, (_match, attrs: string) => {
      styles[column] = cellStyle(attrs);
      return '';
    });
  });

  const cells = dataCells(rowNumber, row ?? {
    employeeId: '',
    tin: '',
    taxpayerName: '',
    socialSecurityNumber: '',
    passport: null,
    numberOfWeeksEmployed: 0,
    totalEmoluments: 0,
    taxableBenefits: 0,
    commissions: 0,
    taxWithheld: 0,
  }, styles);

  if (!row) {
    const blanks = DATA_COLUMNS.map((column) => `<c r="${column}${rowNumber}"${styles[column] ?? ''}/>`).join('');
    return next.replace(/(<row\b[^>]*>)/, `$1${blanks}`);
  }

  return next.replace(/(<row\b[^>]*>)/, `$1${cells}`);
}

export function fillPayeReconciliationEmployeeDetailsSheet(
  sheetXml: string,
  report: PayeReconciliationEmployeeDetailsReport,
): string {
  if (report.rows.length > TABLE_LAST_ROW - DATA_START_ROW + 1) {
    throw new Error('PAYE Reconciliation Employee Details supports at most 3,501 employees in one workbook.');
  }

  let sheet = sheetXml;
  sheet = setStyledTextCell(sheet, HEADER_CELLS.tin, report.submitter.tin || '');
  sheet = setStyledTextCell(sheet, HEADER_CELLS.name, report.submitter.name || '');
  sheet = setStyledTextCell(sheet, HEADER_CELLS.address, report.submitter.address || '');
  sheet = setStyledNumberCell(sheet, 'C14', report.year);
  sheet = setStyledTextCell(sheet, HEADER_CELLS.period, report.period);

  return sheet.replace(/<row r="(\d+)"[^>]*>[\s\S]*?<\/row>/g, (rowXml, rowNumberText: string) => {
    const rowNumber = Number(rowNumberText);
    if (rowNumber < DATA_START_ROW || rowNumber > TABLE_LAST_ROW) {
      return rowXml;
    }

    return patchDataRow(rowXml, rowNumber, report.rows[rowNumber - DATA_START_ROW] ?? null);
  });
}

function fillPeriodLookup(configXml: string): string {
  let xml = configXml;
  PERIOD_MONTHS.forEach((month, index) => {
    const ref = `C${index + 3}`;
    const cell = `<c r="${ref}" s="3" t="inlineStr"><is><t>${month}</t></is></c>`;
    const pattern = new RegExp(`<c r="${ref}"(?: [^>]*?)?(?:/>|>[\\s\\S]*?</c>)`);
    if (pattern.test(xml)) {
      xml = xml.replace(pattern, cell);
      return;
    }

    xml = xml.replace(
      /(<c r="B14"(?: [^>]*?)?(?:\/>|>[\s\S]*?<\/c>))/,
      `$1${cell}`,
    );
  });

  return xml;
}

async function loadTemplate(): Promise<ArrayBuffer> {
  const response = await fetch(`${import.meta.env.BASE_URL}templates/paye-reconciliation-employee-details.xlsx`);
  if (!response.ok) {
    throw new Error('Unable to load the PAYE reconciliation employee details Excel template.');
  }

  return response.arrayBuffer();
}

function buildExportFilename(report: PayeReconciliationEmployeeDetailsReport): string {
  return `PAYE_Reconciliation_Employee_Details_${report.year}_${sanitizeFilename(report.period)}.xlsx`;
}

export async function buildPayeReconciliationEmployeeDetailsWorkbook(
  template: ArrayBuffer,
  report: PayeReconciliationEmployeeDetailsReport,
): Promise<ArrayBuffer> {
  const zip = await JSZip.loadAsync(template);
  const sheetFile = zip.file('xl/worksheets/sheet1.xml');
  const configFile = zip.file('xl/worksheets/sheet2.xml');
  const workbookFile = zip.file('xl/workbook.xml');
  const relsFile = zip.file('xl/_rels/workbook.xml.rels');
  const contentTypesFile = zip.file('[Content_Types].xml');

  if (!sheetFile || !configFile || !workbookFile || !relsFile || !contentTypesFile) {
    throw new Error('PAYE reconciliation template is missing the Employee Details workbook parts.');
  }

  zip.file(
    'xl/worksheets/sheet1.xml',
    fillPayeReconciliationEmployeeDetailsSheet(await sheetFile.async('string'), report),
  );
  zip.file('xl/worksheets/sheet2.xml', fillPeriodLookup(await configFile.async('string')));

  let workbook = await workbookFile.async('string');
  if (!workbook.includes('<definedName name="Lookup_Periods">Config!$C$2</definedName>')) {
    throw new Error('PAYE reconciliation template is missing the period lookup.');
  }
  workbook = workbook.replace(
    '<definedName name="Lookup_Periods">Config!$C$2</definedName>',
    '<definedName name="Lookup_Periods">Config!$C$2:$C$14</definedName>',
  );
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

export function formatPayeReconciliationCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

export async function exportPayeReconciliationEmployeeDetailsExcel(
  report: PayeReconciliationEmployeeDetailsReport,
): Promise<void> {
  const template = await loadTemplate();
  const buffer = await buildPayeReconciliationEmployeeDetailsWorkbook(template, report);
  await downloadXlsxBuffer(buffer, buildExportFilename(report), {
    title: 'PAYE Reconciliation Employee Details',
    period: `${report.year} ${report.period}`,
  });
}
