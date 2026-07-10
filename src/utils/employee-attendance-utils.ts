import { date } from 'quasar';
import type { CalendarEntry } from 'src/stores/calendar-store';
import type { TimesheetRow } from 'src/stores/attendance-store';
import type { TimesheetEmployeeGroup } from 'src/stores/timesheet-store';
import { getVisibleDays } from 'src/utils/scheduler-utils';

export type AttendanceViewMode = 'week' | 'month' | 'table';

export interface AttendanceDayCell {
  date: string;
  weekdayLabel: string;
  isWeekend: boolean;
  isOutsideMonth: boolean;
  holiday: CalendarEntry | null;
  leaves: CalendarEntry[];
  scheduledWork: CalendarEntry[];
  timesheetRows: TimesheetRow[];
  isLeaveDay: boolean;
  isHoliday: boolean;
  hasTimesheet: boolean;
  isAutoFilled: boolean;
  totalHours: number;
}

const WEEKDAY_HEADERS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function attendanceWeekdayHeaders(): readonly string[] {
  return WEEKDAY_HEADERS;
}

function monthKey(anchorDate: string): string {
  const parsed = date.extractDate(anchorDate, 'YYYY-MM-DD');
  return date.formatDate(parsed, 'YYYY-MM');
}

function isOutsideAnchorMonth(day: string, anchorDate: string): boolean {
  return monthKey(day) !== monthKey(anchorDate);
}

export function getMonthCalendarDays(anchorDate: string): string[] {
  const parsed = date.extractDate(anchorDate, 'YYYY-MM-DD');
  const firstOfMonth = date.startOfDate(parsed, 'month');
  const lastOfMonth = date.endOfDate(parsed, 'month');
  const firstDayOfWeek = firstOfMonth.getDay();
  const mondayOffset = firstDayOfWeek === 0 ? -6 : 1 - firstDayOfWeek;
  const gridStart = date.addToDate(firstOfMonth, { days: mondayOffset });
  const lastDayOfWeek = lastOfMonth.getDay();
  const sundayOffset = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
  const gridEnd = date.addToDate(lastOfMonth, { days: sundayOffset });
  const days: string[] = [];
  let current = gridStart;

  while (current <= gridEnd) {
    days.push(date.formatDate(current, 'YYYY-MM-DD'));
    current = date.addToDate(current, { days: 1 });
  }

  return days;
}

export function getAttendanceDateRange(
  viewMode: AttendanceViewMode,
  anchorDate: string,
): { start: string; end: string } {
  if (viewMode === 'month') {
    const parsed = date.extractDate(anchorDate, 'YYYY-MM-DD');
    return {
      start: date.formatDate(date.startOfDate(parsed, 'month'), 'YYYY-MM-DD'),
      end: date.formatDate(date.endOfDate(parsed, 'month'), 'YYYY-MM-DD'),
    };
  }

  if (viewMode === 'table') {
    return getAttendanceDateRange('week', anchorDate);
  }

  const days = getVisibleDays('week', anchorDate);
  return { start: days[0] ?? anchorDate, end: days[days.length - 1] ?? anchorDate };
}

export function formatAttendancePeriodLabel(
  viewMode: AttendanceViewMode,
  anchorDate: string,
): string {
  const parsed = date.extractDate(anchorDate, 'YYYY-MM-DD');

  if (viewMode === 'month') {
    return date.formatDate(parsed, 'MMMM YYYY');
  }

  const days = getVisibleDays('week', anchorDate);
  if (!days.length) {
    return '';
  }

  const startDay = days[0];
  const endDay = days[days.length - 1];
  if (!startDay || !endDay) {
    return '';
  }

  const start = date.extractDate(startDay, 'YYYY-MM-DD');
  const end = date.extractDate(endDay, 'YYYY-MM-DD');
  const sameMonth = date.formatDate(start, 'MMM') === date.formatDate(end, 'MMM');
  const startLabel = date.formatDate(start, 'MMM D');
  const endLabel = sameMonth
    ? date.formatDate(end, 'D, YYYY')
    : date.formatDate(end, 'MMM D, YYYY');

  return `${startLabel} – ${endLabel}`;
}

function visibleDaysForView(viewMode: AttendanceViewMode, anchorDate: string): string[] {
  if (viewMode === 'month') {
    return getMonthCalendarDays(anchorDate);
  }

  return getVisibleDays('week', anchorDate);
}

function isLeaveEntry(entry: CalendarEntry): boolean {
  return entry.source === 'leave'
    || ['vacation', 'sick', 'other'].includes(entry.type);
}

function isHolidayEntry(entry: CalendarEntry): boolean {
  return entry.source === 'holiday' || entry.type === 'holiday';
}

function isWorkEntry(entry: CalendarEntry): boolean {
  return entry.source === 'scheduled_work' || entry.type === 'work';
}

function entriesForDate(entries: CalendarEntry[], day: string): CalendarEntry[] {
  return entries.filter((entry) => entry.date === day);
}

export function buildAttendanceDayCells(
  anchorDate: string,
  timesheetRows: TimesheetRow[],
  calendarEntries: CalendarEntry[],
  viewMode: AttendanceViewMode = 'week',
): AttendanceDayCell[] {
  const days = visibleDaysForView(viewMode, anchorDate);
  const rowsByDate = new Map<string, TimesheetRow[]>();

  for (const row of timesheetRows) {
    const day = row.date.slice(0, 10);
    const bucket = rowsByDate.get(day) ?? [];
    bucket.push(row);
    rowsByDate.set(day, bucket);
  }

  return days.map((day) => {
    const parsed = date.extractDate(day, 'YYYY-MM-DD');
    const dayEntries = entriesForDate(calendarEntries, day);
    const holiday = dayEntries.find(isHolidayEntry) ?? null;
    const leaves = dayEntries.filter(isLeaveEntry);
    const scheduledWork = dayEntries.filter(isWorkEntry);
    const timesheets = rowsByDate.get(day) ?? [];
    const totalHours = timesheets.reduce((sum, row) => sum + (row.hoursWorked ?? 0), 0);
    const isAutoFilled = timesheets.some(
      (row) => !row.clockInTime && !row.clockOutTime && row.hoursWorked > 0,
    );

    return {
      date: day,
      weekdayLabel: date.formatDate(parsed, 'ddd'),
      isWeekend: parsed.getDay() === 0 || parsed.getDay() === 6,
      isOutsideMonth: viewMode === 'month' ? isOutsideAnchorMonth(day, anchorDate) : false,
      holiday,
      leaves,
      scheduledWork,
      timesheetRows: timesheets,
      isLeaveDay: leaves.length > 0,
      isHoliday: holiday !== null,
      hasTimesheet: timesheets.length > 0,
      isAutoFilled,
      totalHours,
    };
  });
}

export function buildEmployeeTimesheetGroup(
  employeeId: string,
  employeeName: string | null,
  employeeCode: string | null,
  departmentName: string | null,
  rows: TimesheetRow[],
): TimesheetEmployeeGroup {
  const firstRow = rows[0];
  const employmentDetailId = firstRow?.employmentDetailId ?? null;

  return {
    key: `${employeeId}:${employmentDetailId ?? 'none'}`,
    employeeId,
    employmentDetailId,
    employmentContractLabel: firstRow?.employmentContractLabel ?? null,
    employeeName,
    employeeCode,
    departmentName,
    totalHours: rows.reduce((sum, row) => sum + (row.hoursWorked ?? 0), 0),
    rows: [...rows].sort((left, right) => left.date.localeCompare(right.date)),
  };
}

export function compensationMethodLabel(method: string | null | undefined): string {
  switch (method) {
    case 'HOURLY_NO_OT':
      return 'Hourly (no overtime)';
    case 'HOURLY_OT':
      return 'Hourly (with overtime)';
    case 'BASE_NO_OT':
      return 'Base rate (no overtime)';
    case 'BASE_OT':
      return 'Base rate (with overtime)';
    default:
      return method ?? 'Not set';
  }
}
