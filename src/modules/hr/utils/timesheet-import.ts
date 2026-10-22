import * as XLSX from 'xlsx';

export interface TimesheetImportRow {
  employeeCode: string;
  employeeName: string | null;
  departmentName: string | null;
  date: string | null;
  timeIn: string | null;
  timeOut: string | null;
  type: string | null;
  lunchHours: number | null;
}

const TEMPLATE_HEADERS = [
  'Employee code',
  'Employee name',
  'Department',
  'Date',
  'Time in',
  'Time out',
  'Type',
  'Hours worked',
  'Lunch hours',
  'Total hours',
];

const INSTRUCTIONS = 'Employee code, date, time in, and time out are required. Employee name is for reference. Leave Department blank to use the employee’s department. Lunch hours are optional. Hours worked and total hours are calculated from the clock times.';

function cellText(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).trim();
  }
  return '';
}

function normalizeHeader(value: unknown): string {
  return cellText(value).toLowerCase().replace(/[^a-z0-9]/g, '');
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
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    return text.slice(0, 10);
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return null;
}

function spreadsheetTime(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0 && value < 1) {
    const minutes = Math.round(value * 24 * 60);
    const hours = Math.floor(minutes / 60) % 24;
    return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  const text = cellText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap]m)?$/i);
  if (!match) {
    return text ? text : null;
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = (match[3] ?? '').toLowerCase();
  if (meridiem === 'pm' && hours < 12) hours += 12;
  if (meridiem === 'am' && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) {
    return null;
  }

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function headerKey(value: unknown): keyof TimesheetImportRow | null {
  const key = normalizeHeader(value);
  if (['employeecode', 'employeeid', 'code'].includes(key)) return 'employeeCode';
  if (['employeename', 'name', 'teammember'].includes(key)) return 'employeeName';
  if (['department', 'departmentname'].includes(key)) return 'departmentName';
  if (['date', 'workdate'].includes(key)) return 'date';
  if (['timein', 'clockin'].includes(key)) return 'timeIn';
  if (['timeout', 'clockout'].includes(key)) return 'timeOut';
  if (key === 'type') return 'type';
  if (['lunchhours', 'lunchhrs', 'lunch'].includes(key)) return 'lunchHours';
  return null;
}

export function downloadTimesheetImportTemplate(): void {
  const rows = [
    [INSTRUCTIONS],
    TEMPLATE_HEADERS,
    ['100001', 'Abner Escobar', '', '2026-10-01', '03:00', '16:00', 'Regular', '', '1', ''],
    ['100002', 'Abner Figueroa', '', '2026-10-01', '03:00', '15:00', 'Regular', '', '1', ''],
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  worksheet['!cols'] = TEMPLATE_HEADERS.map((header) => ({ wch: Math.max(header.length + 2, 14) }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
  XLSX.writeFile(workbook, 'timesheet-upload-template.xlsx');
}

export async function readTimesheetImportFile(file: File): Promise<{
  rows: TimesheetImportRow[];
  errors: string[];
}> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => normalizeHeader(name) === 'timesheet')
    ?? workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet) {
    return { rows: [], errors: ['The workbook has no sheets.'] };
  }

  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });
  const headerIndex = sheetRows.findIndex((row) => row.some((cell) => headerKey(cell) === 'employeeCode'));
  if (headerIndex < 0) {
    return { rows: [], errors: ['Could not find a header row with Employee code.'] };
  }

  const map: Partial<Record<keyof TimesheetImportRow, number>> = {};
  (sheetRows[headerIndex] ?? []).forEach((cell, index) => {
    const key = headerKey(cell);
    if (key) {
      map[key] = index;
    }
  });

  const rows: TimesheetImportRow[] = [];
  const errors: string[] = [];

  for (let index = headerIndex + 1; index < sheetRows.length; index += 1) {
    const row = sheetRows[index] ?? [];
    if (!row.some((cell) => cellText(cell) !== '')) {
      continue;
    }

    const value = (key: keyof TimesheetImportRow) => {
      const column = map[key];
      return column == null ? '' : row[column];
    };
    const employeeCode = cellText(value('employeeCode'));
    const date = spreadsheetDate(value('date'));
    if (!employeeCode && !date) {
      continue;
    }

    const lunchText = cellText(value('lunchHours'));
    const parsedLunch = Number(lunchText);
    const lunchHours = lunchText !== '' && Number.isFinite(parsedLunch) ? Math.abs(parsedLunch) : null;
    if (lunchText !== '' && lunchHours === null) {
      errors.push(`Row ${index + 1}: lunch hours must be a number.`);
    }

    rows.push({
      employeeCode,
      employeeName: cellText(value('employeeName')) || null,
      departmentName: cellText(value('departmentName')) || null,
      date,
      timeIn: spreadsheetTime(value('timeIn')),
      timeOut: spreadsheetTime(value('timeOut')),
      type: cellText(value('type')) || null,
      lunchHours,
    });
  }

  if (rows.length === 0 && errors.length === 0) {
    errors.push('The file has no timesheet rows.');
  }

  return { rows, errors };
}
