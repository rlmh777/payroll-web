import * as XLSX from 'xlsx';
import type { PayrollAllowanceEmployeeOption } from '@payroll/stores/payroll-allowance-store';

export type PayrollAllowanceTemplateSort = 'last_name' | 'department';

export interface PayrollAllowanceImportRow {
  employeeIdentifier: string;
  employeeName?: string | null;
  allowanceName: string;
  accountCode: string;
  allowanceDate: string;
  quantity: number;
  unitAmount: number;
  note?: string | null;
}

export const PAYROLL_ALLOWANCE_IMPORT_HEADERS = [
  'Employee ID',
  'Last Name',
  'First Name',
  'Department',
  'Other Payment',
  'Account Code',
  'Date',
  'Quantity',
  'Unit Amount',
  'Note',
] as const;

const INSTRUCTIONS = 'Fill Other Payment, Account Code, Date, Quantity, and Unit Amount. Add extra rows for multiple other payments per employee.';

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }

  return '';
}

function numberCell(value: unknown): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function spreadsheetDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const excelDate = new Date(Date.UTC(1899, 11, 30 + Math.floor(value)));
    return [
      String(excelDate.getUTCFullYear()).padStart(4, '0'),
      String(excelDate.getUTCMonth() + 1).padStart(2, '0'),
      String(excelDate.getUTCDate()).padStart(2, '0'),
    ].join('-');
  }

  const text = cellText(value);
  if (!text) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }

  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const month = slashMatch[1] ?? '';
    const day = slashMatch[2] ?? '';
    const year = slashMatch[3] ?? '';
    const fullYear = year.length === 2 ? `20${year}` : year;
    return `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const date = new Date(text);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function normalizeHeader(value: unknown): string {
  return cellText(value).toLowerCase().replace(/\s+/g, ' ');
}

export function sortEmployeesForTemplate(
  employees: PayrollAllowanceEmployeeOption[],
  sort: PayrollAllowanceTemplateSort,
): PayrollAllowanceEmployeeOption[] {
  const list = [...employees];

  if (sort === 'department') {
    return list.sort((left, right) => {
      const departmentCompare = (left.departmentName ?? '').localeCompare(right.departmentName ?? '');
      if (departmentCompare !== 0) {
        return departmentCompare;
      }

      const lastNameCompare = (left.lastName ?? '').localeCompare(right.lastName ?? '');
      if (lastNameCompare !== 0) {
        return lastNameCompare;
      }

      return (left.firstName ?? '').localeCompare(right.firstName ?? '');
    });
  }

  return list.sort((left, right) => {
    const lastNameCompare = (left.lastName ?? '').localeCompare(right.lastName ?? '');
    if (lastNameCompare !== 0) {
      return lastNameCompare;
    }

    return (left.firstName ?? '').localeCompare(right.firstName ?? '');
  });
}

export function buildPayrollAllowanceTemplateRows(
  employees: PayrollAllowanceEmployeeOption[],
  sort: PayrollAllowanceTemplateSort,
): unknown[][] {
  const sortedEmployees = sortEmployeesForTemplate(employees, sort);

  return [
    [INSTRUCTIONS],
    [...PAYROLL_ALLOWANCE_IMPORT_HEADERS],
    ...sortedEmployees.map((employee) => [
      employee.code ?? employee.id,
      employee.lastName ?? '',
      employee.firstName ?? '',
      employee.departmentName ?? '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]),
  ];
}

export function downloadPayrollAllowanceTemplate(
  employees: PayrollAllowanceEmployeeOption[],
  sort: PayrollAllowanceTemplateSort,
): void {
  const rows = buildPayrollAllowanceTemplateRows(employees, sort);
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Other Payments');

  const suffix = sort === 'department' ? 'by-department' : 'by-name';
  XLSX.writeFile(workbook, `payroll-other-payments-template-${suffix}.xlsx`);
}

function findHeaderIndex(sheetRows: unknown[][]): number {
  return sheetRows.findIndex((row) => {
    const normalized = row.map((cell) => normalizeHeader(cell));
    return normalized.includes('employee id')
      && (normalized.includes('allowance') || normalized.includes('other payment'));
  });
}

function columnIndex(headers: string[], labels: string[]): number {
  for (const label of labels) {
    const index = headers.indexOf(label);
    if (index >= 0) {
      return index;
    }
  }

  return -1;
}

export function parsePayrollAllowanceImportRows(sheetRows: unknown[][]): {
  rows: PayrollAllowanceImportRow[];
  errors: string[];
} {
  const headerIndex = findHeaderIndex(sheetRows);
  if (headerIndex < 0) {
    return {
      rows: [],
      errors: ['Could not find the header row. Use the downloaded template.'],
    };
  }

  const headers = (sheetRows[headerIndex] ?? []).map((cell) => normalizeHeader(cell));
  const employeeIdIndex = columnIndex(headers, ['employee id']);
  const lastNameIndex = columnIndex(headers, ['last name']);
  const firstNameIndex = columnIndex(headers, ['first name']);
  const allowanceIndex = columnIndex(headers, ['other payment', 'allowance']);
  const accountCodeIndex = columnIndex(headers, ['account code']);
  const dateIndex = columnIndex(headers, ['date']);
  const quantityIndex = columnIndex(headers, ['quantity']);
  const unitAmountIndex = columnIndex(headers, ['unit amount', 'unit amount ']);
  const noteIndex = columnIndex(headers, ['note']);

  const parsedRows: PayrollAllowanceImportRow[] = [];
  const errors: string[] = [];

  for (let rowIndex = headerIndex + 1; rowIndex < sheetRows.length; rowIndex++) {
    const row = sheetRows[rowIndex] ?? [];
    const employeeIdentifier = cellText(row[employeeIdIndex]);
    const allowanceName = cellText(row[allowanceIndex]);

    if (!employeeIdentifier) {
      continue;
    }

    if (!allowanceName) {
      continue;
    }

    const accountCode = cellText(row[accountCodeIndex]);
    const allowanceDate = spreadsheetDate(row[dateIndex]);
    const quantity = numberCell(row[quantityIndex]);
    const unitAmount = numberCell(row[unitAmountIndex]);
    const note = cellText(row[noteIndex]);
    const rowLabel = `Row ${rowIndex + 1}`;

    if (!allowanceDate) {
      errors.push(`${rowLabel}: Date is required.`);
      continue;
    }

    if (quantity === null || quantity <= 0) {
      errors.push(`${rowLabel}: Quantity must be greater than zero.`);
      continue;
    }

    if (unitAmount === null || unitAmount < 0) {
      errors.push(`${rowLabel}: Unit amount must be zero or greater.`);
      continue;
    }

    const lastName = cellText(row[lastNameIndex]);
    const firstName = cellText(row[firstNameIndex]);
    const employeeName = [lastName, firstName].filter(Boolean).join(', ') || null;

    parsedRows.push({
      employeeIdentifier,
      employeeName,
      allowanceName,
      accountCode,
      allowanceDate,
      quantity,
      unitAmount,
      note: note || null,
    });
  }

  return { rows: parsedRows, errors };
}

export async function readPayrollAllowanceImportFile(file: File): Promise<{
  rows: PayrollAllowanceImportRow[];
  errors: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    return { rows: [], errors: ['The uploaded workbook does not contain any sheets.'] };
  }

  const worksheet = workbook.Sheets[firstSheetName];
  if (!worksheet) {
    return { rows: [], errors: ['The first worksheet could not be read.'] };
  }

  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
    header: 1,
    raw: true,
    blankrows: false,
    defval: null,
  });
  const rows = rawRows.filter((row): row is unknown[] => Array.isArray(row));

  return parsePayrollAllowanceImportRows(rows);
}
