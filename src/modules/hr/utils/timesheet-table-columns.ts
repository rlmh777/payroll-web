import type { QTableColumn } from 'quasar';

export const TIMESHEET_ACTIONS_COLUMN = 'actions';

export const TIMESHEET_TABLE_COLUMNS: QTableColumn[] = [
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'workingStatus', label: 'Status', field: 'workingStatus', align: 'left' },
  { name: 'clockInTime', label: 'Clock in', field: 'clockInTime', align: 'left' },
  { name: 'clockInDeviceId', label: 'Clock-in device', field: 'clockInDeviceId', align: 'left' },
  { name: 'clockOutTime', label: 'Clock out', field: 'clockOutTime', align: 'left' },
  { name: 'clockOutDeviceId', label: 'Clock-out device', field: 'clockOutDeviceId', align: 'left' },
  { name: 'roundOffClockInTime', label: 'Rounded in', field: 'roundOffClockInTime', align: 'left' },
  { name: 'roundOffClockOutTime', label: 'Rounded out', field: 'roundOffClockOutTime', align: 'left' },
  { name: 'clockedHoursWorked', label: 'Clocked hrs', field: 'clockedHoursWorked', align: 'right' },
  { name: 'lunchHourHours', label: 'Lunch hrs', field: 'lunchHourHours', align: 'right' },
  { name: 'hoursWorked', label: 'Payable hrs', field: 'hoursWorked', align: 'right' },
  { name: 'regularHours', label: 'Regular', field: 'regularHours', align: 'right' },
  { name: 'overtimeHours', label: 'OT', field: 'overtimeHours', align: 'right' },
  { name: 'holidayHours', label: 'Holiday', field: 'holidayHours', align: 'right' },
  { name: 'unpaidHours', label: 'Unpaid hrs', field: 'unpaidHours', align: 'right' },
  { name: 'hasBeenPaid', label: 'Paid', field: 'hasBeenPaid', align: 'center' },
  { name: 'paidHours', label: 'Paid hrs', field: 'paidHours', align: 'right' },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' },
  { name: 'employmentContractLabel', label: 'Contract', field: 'employmentContractLabel', align: 'left' },
  { name: 'compensationLabel', label: 'Compensation', field: 'compensationLabel', align: 'left' },
  { name: 'worksiteName', label: 'Worksite', field: 'worksiteName', align: 'left' },
  { name: 'payType', label: 'Pay type', field: 'payType', align: 'left' },
  { name: 'hourlyRate', label: 'Hourly rate', field: 'hourlyRate', align: 'right' },
  { name: 'approvalStatus', label: 'Review', field: 'approvalStatus', align: 'left' },
  { name: 'comment', label: 'Comment', field: 'comment', align: 'left' },
  { name: 'approvedByName', label: 'Approved by', field: 'approvedByName', align: 'left' },
  { name: 'approvedAt', label: 'Approved at', field: 'approvedAt', align: 'left' },
  { name: TIMESHEET_ACTIONS_COLUMN, label: 'Actions', field: TIMESHEET_ACTIONS_COLUMN, align: 'right' },
];

export const DEFAULT_TIMESHEET_VISIBLE_COLUMNS = [
  'date',
  'roundOffClockInTime',
  'roundOffClockOutTime',
  'lunchHourHours',
  'hoursWorked',
  'regularHours',
  'overtimeHours',
  'paidHours',
  'hasBeenPaid',
  'approvalStatus',
  'comment',
  TIMESHEET_ACTIONS_COLUMN,
];

export const TIMESHEET_TOGGLEABLE_COLUMN_NAMES = TIMESHEET_TABLE_COLUMNS
  .map((column) => column.name)
  .filter((name): name is string => Boolean(name) && name !== TIMESHEET_ACTIONS_COLUMN);

/** Older saved column prefs used `isPaid` for the Paid column. */
const LEGACY_COLUMN_ALIASES: Record<string, string> = {
  isPaid: 'hasBeenPaid',
};

const STORAGE_KEY = 'timesheet_visible_columns_v9';

export function normalizeVisibleColumnNames(names: string[]): string[] {
  const allowed = new Set(
    TIMESHEET_TABLE_COLUMNS
      .map((column) => column.name)
      .filter((name): name is string => Boolean(name)),
  );

  const selected = new Set(
    names
      .map((name) => LEGACY_COLUMN_ALIASES[name] ?? name)
      .filter((name) => allowed.has(name) && name !== TIMESHEET_ACTIONS_COLUMN),
  );

  const normalized = TIMESHEET_TABLE_COLUMNS
    .map((column) => column.name)
    .filter((name): name is string => Boolean(name) && selected.has(name));

  normalized.push(TIMESHEET_ACTIONS_COLUMN);

  if (normalized.length === 1) {
    return [...DEFAULT_TIMESHEET_VISIBLE_COLUMNS];
  }

  return normalized;
}

export function loadVisibleColumnNames(): string[] {
  if (typeof localStorage === 'undefined') {
    return [...DEFAULT_TIMESHEET_VISIBLE_COLUMNS];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [...DEFAULT_TIMESHEET_VISIBLE_COLUMNS];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [...DEFAULT_TIMESHEET_VISIBLE_COLUMNS];
    }

    return normalizeVisibleColumnNames(parsed.filter((value): value is string => typeof value === 'string'));
  } catch {
    return [...DEFAULT_TIMESHEET_VISIBLE_COLUMNS];
  }
}

export function saveVisibleColumnNames(names: string[]): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeVisibleColumnNames(names)));
}
