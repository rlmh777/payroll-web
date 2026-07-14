import * as XLSX from 'xlsx';

export const EMPLOYEE_IMPORT_SHEET_NAMES = [
  'Employees',
  'Employment',
  'Compensation',
  'Banks',
  'Contacts',
  'LeaveEntitlements',
  'SsBenefits',
  'ScheduledWork',
  'ClockingLogs',
] as const;

export type EmployeeImportSheetName = (typeof EMPLOYEE_IMPORT_SHEET_NAMES)[number];

export type EmployeeImportRow = Record<string, string | number | boolean | null>;

export interface EmployeeImportSheets {
  employees: EmployeeImportRow[];
  employment: EmployeeImportRow[];
  compensation: EmployeeImportRow[];
  banks: EmployeeImportRow[];
  contacts: EmployeeImportRow[];
  leaveEntitlements: EmployeeImportRow[];
  ssBenefits: EmployeeImportRow[];
  scheduledWork: EmployeeImportRow[];
  clockingLogs: EmployeeImportRow[];
}

export interface EmployeeImportPayload {
  employees: EmployeeImportRow[];
  employment: EmployeeImportRow[];
  compensation: EmployeeImportRow[];
  scheduledWork: EmployeeImportRow[];
  clockingLogs: EmployeeImportRow[];
  banks?: EmployeeImportRow[];
  contacts?: EmployeeImportRow[];
  leaveEntitlements?: EmployeeImportRow[];
  ssBenefits?: EmployeeImportRow[];
}

const SHEET_TO_PAYLOAD_KEY: Record<EmployeeImportSheetName, keyof EmployeeImportSheets> = {
  Employees: 'employees',
  Employment: 'employment',
  Compensation: 'compensation',
  Banks: 'banks',
  Contacts: 'contacts',
  LeaveEntitlements: 'leaveEntitlements',
  SsBenefits: 'ssBenefits',
  ScheduledWork: 'scheduledWork',
  ClockingLogs: 'clockingLogs',
};

function toCellValue(value: unknown): string | number | boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean' || typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const hours = value.getHours();
    const minutes = value.getMinutes();
    const seconds = value.getSeconds();

    if (hours === 0 && minutes === 0 && seconds === 0) {
      return `${year}-${month}-${day}`;
    }

    return `${year}-${month}-${day} ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();
  if (!text) {
    return null;
  }

  const lower = text.toLowerCase();
  if (lower === 'true') return true;
  if (lower === 'false') return false;

  return text;
}

function asText(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

/** Normalize Excel headers to camelCase API field names. */
export function normalizeHeaderKey(header: unknown): string {
  const raw = asText(header).trim();
  if (!raw) {
    return '';
  }

  if (/^[a-z][a-zA-Z0-9]*$/.test(raw)) {
    return raw;
  }

  const parts = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean);

  if (!parts.length) {
    return '';
  }

  return parts
    .map((part, index) => {
      const lower = part.toLowerCase();
      if (index === 0) {
        return lower;
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
}

function parseSheetRows(worksheet: XLSX.WorkSheet | undefined): EmployeeImportRow[] {
  if (!worksheet) {
    return [];
  }

  const matrix = XLSX.utils.sheet_to_json<(string | number | boolean | Date | null | undefined)[]>(worksheet, {
    header: 1,
    raw: false,
    defval: '',
    blankrows: false,
  });

  if (!matrix.length) {
    return [];
  }

  const headers = (matrix[0] ?? []).map((header) => normalizeHeaderKey(header));
  const rows: EmployeeImportRow[] = [];

  for (const rawRow of matrix.slice(1)) {
    const row: EmployeeImportRow = {};
    let hasValue = false;

    headers.forEach((key, index) => {
      if (!key) {
        return;
      }

      const value = toCellValue(rawRow[index]);
      row[key] = value;
      if (value !== null && value !== '') {
        hasValue = true;
      }
    });

    if (hasValue) {
      rows.push(row);
    }
  }

  return rows;
}

function findSheetName(workbook: XLSX.WorkBook, expected: EmployeeImportSheetName): string | undefined {
  const normalizedExpected = expected.toLowerCase().replace(/[^a-z0-9]/g, '');
  return workbook.SheetNames.find(
    (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '') === normalizedExpected,
  );
}

export function emptyEmployeeImportSheets(): EmployeeImportSheets {
  return {
    employees: [],
    employment: [],
    compensation: [],
    banks: [],
    contacts: [],
    leaveEntitlements: [],
    ssBenefits: [],
    scheduledWork: [],
    clockingLogs: [],
  };
}

export function parseEmployeeImportWorkbook(workbook: XLSX.WorkBook): EmployeeImportSheets {
  const sheets = emptyEmployeeImportSheets();

  for (const sheetName of EMPLOYEE_IMPORT_SHEET_NAMES) {
    const actualName = findSheetName(workbook, sheetName);
    const key = SHEET_TO_PAYLOAD_KEY[sheetName];
    sheets[key] = parseSheetRows(actualName ? workbook.Sheets[actualName] : undefined);
  }

  return sheets;
}

export async function parseEmployeeImportFile(file: File): Promise<EmployeeImportSheets> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  return parseEmployeeImportWorkbook(workbook);
}

export function toEmployeeImportPayload(sheets: EmployeeImportSheets): EmployeeImportPayload {
  const payload: EmployeeImportPayload = {
    employees: sheets.employees,
    employment: sheets.employment,
    compensation: sheets.compensation,
    scheduledWork: sheets.scheduledWork,
    clockingLogs: sheets.clockingLogs,
  };

  if (sheets.banks.length) payload.banks = sheets.banks;
  if (sheets.contacts.length) payload.contacts = sheets.contacts;
  if (sheets.leaveEntitlements.length) payload.leaveEntitlements = sheets.leaveEntitlements;
  if (sheets.ssBenefits.length) payload.ssBenefits = sheets.ssBenefits;

  return payload;
}

export function employeeImportSheetCounts(sheets: EmployeeImportSheets): { label: string; count: number }[] {
  return [
    { label: 'Employees', count: sheets.employees.length },
    { label: 'Employment', count: sheets.employment.length },
    { label: 'Compensation', count: sheets.compensation.length },
    { label: 'Banks', count: sheets.banks.length },
    { label: 'Contacts', count: sheets.contacts.length },
    { label: 'Leave entitlements', count: sheets.leaveEntitlements.length },
    { label: 'SS benefits', count: sheets.ssBenefits.length },
    { label: 'Scheduled work', count: sheets.scheduledWork.length },
    { label: 'Clocking logs', count: sheets.clockingLogs.length },
  ];
}
