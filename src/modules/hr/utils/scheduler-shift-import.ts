import * as XLSX from 'xlsx';
import type { CalendarEmployee } from '@hr/stores/calendar-store';

export interface SchedulerShiftImportRow {
  employeeCode: string;
  departmentName?: string | null;
  worksiteName?: string | null;
  startDate: string;
  endDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  description?: string | null;
  rate?: number | null;
  includeLunchHour?: boolean | null;
  lunchHourHours?: number | null;
}

export interface SchedulerShiftImportPreviewRow {
  rowNumber: number;
  employeeCode: string;
  employeeId?: string | null;
  employeeName?: string | null;
  departmentName?: string | null;
  departmentId?: number | null;
  worksiteName?: string | null;
  worksiteId?: number | null;
  employmentDetailId?: string | null;
  startDate: string | null;
  endDate: string | null;
  startTime: string;
  endTime: string;
  description?: string | null;
  rate: number;
  includeLunchHour: boolean;
  lunchHourHours: number;
  errors: string[];
}

export interface SchedulerShiftImportPreview {
  recordCount: number;
  errorCount: number;
  validCount: number;
  companyWide: boolean;
  created?: number;
  rows: SchedulerShiftImportPreviewRow[];
}

export const SCHEDULER_SHIFT_IMPORT_HEADERS = [
  'employeeCode',
  'departmentName',
  'worksiteName',
  'startDate',
  'endDate',
  'startTime',
  'endTime',
  'description',
  'rate',
  'includeLunchHour',
  'lunchHourHours',
] as const;

const INSTRUCTIONS =
  'Fill future shift rows. employeeCode is required. Dates use YYYY-MM-DD. Times use HH:mm (defaults 09:00 / 17:00). Description is optional.';

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

  return [
    String(date.getFullYear()).padStart(4, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function spreadsheetTime(value: unknown): string | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const totalMinutes = Math.round(value * 24 * 60) % (24 * 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
  }

  const text = cellText(value);
  const match = text.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (!match) {
    return null;
  }

  return `${String(Number(match[1])).padStart(2, '0')}:${match[2]}`;
}

function toBool(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = cellText(value).toLowerCase();
  if (['1', 'true', 'yes', 'y'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no', 'n'].includes(normalized)) {
    return false;
  }

  return null;
}

function normalizeHeader(value: unknown): string {
  return cellText(value).toLowerCase().replace(/\s+/g, '');
}

function findHeaderIndex(sheetRows: unknown[][]): number {
  return sheetRows.findIndex((row) => {
    const normalized = row.map(normalizeHeader);
    return normalized.includes('employeecode') || normalized.includes('employeeid');
  });
}

function headerMap(headerRow: unknown[]): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.forEach((cell, index) => {
    const key = normalizeHeader(cell);
    if (!key) {
      return;
    }
    if (key === 'employeeid') {
      map.employeecode = index;
      return;
    }
    map[key] = index;
  });
  return map;
}

function cellAt(row: unknown[], map: Record<string, number>, key: string): unknown {
  const index = map[key];
  return index == null ? undefined : row[index];
}

export function downloadSchedulerShiftImportTemplate(employees: CalendarEmployee[]): void {
  const rows: unknown[][] = [
    [INSTRUCTIONS],
    [...SCHEDULER_SHIFT_IMPORT_HEADERS],
    ...employees.map((employee) => {
      const detail = employee.employmentDetails?.find((item) => item.isActive)
        ?? employee.employmentDetails?.[0]
        ?? null;

      return [
        employee.code ?? employee.id,
        detail?.department?.name ?? '',
        detail?.worksite?.name ?? '',
        '',
        '',
        '09:00',
        '17:00',
        '',
        '1',
        'false',
        '1',
      ];
    }),
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'ScheduledWork');
  XLSX.writeFile(workbook, 'scheduler-shift-import-template.xlsx');
}

export async function readSchedulerShiftImportFile(file: File): Promise<{
  rows: SchedulerShiftImportRow[];
  errors: string[];
}> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames.find((name) => normalizeHeader(name) === 'scheduledwork')
    ?? workbook.SheetNames[0];

  if (!sheetName) {
    return { rows: [], errors: ['The workbook has no sheets.'] };
  }

  const sheet = workbook.Sheets[sheetName];
  if (!sheet) {
    return { rows: [], errors: ['Unable to read the worksheet.'] };
  }

  const sheetRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  });

  const headerIndex = findHeaderIndex(sheetRows);
  if (headerIndex < 0) {
    return {
      rows: [],
      errors: ['Could not find a header row with employeeCode (or Employee ID).'],
    };
  }

  const map = headerMap(sheetRows[headerIndex] ?? []);
  const rows: SchedulerShiftImportRow[] = [];
  const errors: string[] = [];

  for (let index = headerIndex + 1; index < sheetRows.length; index += 1) {
    const row = sheetRows[index] ?? [];
    const hasAnyValue = row.some((cell) => cellText(cell) !== '');
    if (!hasAnyValue) {
      continue;
    }

    const employeeCode = cellText(cellAt(row, map, 'employeecode'));
    const startDate = spreadsheetDate(cellAt(row, map, 'startdate'));
    const endDate = spreadsheetDate(cellAt(row, map, 'enddate'));
    const startTime = spreadsheetTime(cellAt(row, map, 'starttime'));
    const endTime = spreadsheetTime(cellAt(row, map, 'endtime'));
    const description = cellText(cellAt(row, map, 'description'));
    const departmentName = cellText(cellAt(row, map, 'departmentname'));
    const worksiteName = cellText(cellAt(row, map, 'worksitename'));

    if (!employeeCode && !startDate) {
      continue;
    }

    if (!employeeCode) {
      errors.push(`Row ${index + 1}: employeeCode is required.`);
      continue;
    }

    if (!startDate) {
      errors.push(`Row ${index + 1}: startDate is required.`);
      continue;
    }

    rows.push({
      employeeCode,
      departmentName: departmentName || null,
      worksiteName: worksiteName || null,
      startDate,
      endDate,
      startTime,
      endTime,
      description: description || null,
      rate: numberCell(cellAt(row, map, 'rate')),
      includeLunchHour: toBool(cellAt(row, map, 'includelunchhour')),
      lunchHourHours: numberCell(cellAt(row, map, 'lunchhourhours')),
    });
  }

  return { rows, errors };
}
