import { date } from 'quasar';
import type { CalendarEntry } from '@hr/stores/calendar-store';
import type { CalendarType } from '@hr/components/settings/calendar/calendarTypes';

export function todayDateString(): string {
  return date.formatDate(Date.now(), 'YYYY-MM-DD');
}

export function isFutureOrToday(dateStr: string): boolean {
  return dateStr >= todayDateString();
}

export function scheduledWorkIdFromEvent(event: CalendarEntry): string | null {
  if (event.scheduled_work_id) {
    return event.scheduled_work_id;
  }

  const prefixed = event.id.match(/^scheduled-work-([0-9a-f-]{36})-/i);
  if (prefixed?.[1]) {
    return prefixed[1];
  }

  if (event.source === 'scheduled_work' && /^[0-9a-f-]{36}$/i.test(event.id)) {
    return event.id;
  }

  return null;
}

/** @deprecated Use scheduledWorkIdFromEvent */
export function calendarIdFromEvent(event: CalendarEntry): string | null {
  return scheduledWorkIdFromEvent(event);
}

export function formatCalendarTime(value?: string | null): string {
  if (!value) {
    return '';
  }

  return value.slice(0, 5);
}

/** Normalize user/API time input to HH:mm for scheduled work requests. */
export function normalizeCalendarTimeInput(value?: string | null): string {
  return formatCalendarTime(value);
}

export function formatCalendarDateTimeRange(event: CalendarEntry): string | null {
  const startDate = event.start_date ?? event.date;
  const endDate = event.end_date ?? startDate;
  const startTime = formatCalendarTime(event.start_time);
  const endTime = formatCalendarTime(event.end_time);

  if (!startDate) {
    return null;
  }

  const startLabel = `${formatCalendarDisplayDate(startDate)}${startTime ? ` ${startTime}` : ''}`;
  const endLabel = `${formatCalendarDisplayDate(endDate)}${endTime ? ` ${endTime}` : ''}`;

  if (startLabel === endLabel) {
    return startLabel;
  }

  return `${startLabel} – ${endLabel}`;
}

export function leaveIdFromEvent(event: CalendarEntry): string | null {
  if (event.leave_id) {
    return event.leave_id;
  }

  const match = event.id.match(
    /^leave-([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})-(\d{4}-\d{2}-\d{2})$/i,
  );
  return match?.[1] ?? null;
}

export function isLeaveSeries(event: CalendarEntry): boolean {
  return Boolean(
    event.source === 'leave' &&
      event.start_date &&
      event.end_date &&
      event.start_date !== event.end_date,
  );
}

export function canEditEvent(event: CalendarEntry): boolean {
  if (event.source === 'birthday' || event.source === 'holiday') {
    return false;
  }

  if (!isFutureOrToday(event.date)) {
    return false;
  }

  return event.source === 'scheduled_work' || event.source === 'leave';
}

export function formatCalendarDisplayDate(value: string): string {
  return date.formatDate(date.extractDate(value, 'YYYY-MM-DD'), 'MMM D, YYYY');
}

export function eventTooltipLines(
  event: CalendarEntry,
  typeLabels: Record<CalendarType, string>,
): string[] {
  const lines: string[] = [event.description];

  lines.push(`Date: ${formatCalendarDisplayDate(event.date)}`);

  if (event.type) {
    lines.push(`Type: ${typeLabels[event.type] ?? event.type}`);
  }

  if (event.calendar_group_name) {
    lines.push(`Calendar: ${event.calendar_group_name}`);
  }

  const dateTimeRange = formatCalendarDateTimeRange(event);
  if (dateTimeRange) {
    lines.push(`When: ${dateTimeRange}`);
  }

  if (event.department_name) {
    lines.push(`Department: ${event.department_name}`);
  }

  if (event.employment_contract_label) {
    lines.push(`Contract: ${event.employment_contract_label}`);
  }

  if (event.compensation_label) {
    lines.push(`Compensation: ${event.compensation_label}`);
  }

  if (event.worksite_name) {
    lines.push(`Worksite: ${event.worksite_name}`);
  }

  if (event.include_lunch_hour) {
    const hours = event.lunch_hour_hours ?? 1;
    lines.push(`Lunch: ${hours}h deducted`);
  }

  if (event.source === 'leave' && event.start_date && event.end_date && !dateTimeRange?.includes('–')) {
    const periodStart = formatCalendarDisplayDate(event.start_date);
    const periodEnd = formatCalendarDisplayDate(event.end_date);
    lines.push(
      event.start_date === event.end_date
        ? `Leave day: ${periodStart}`
        : `Leave period: ${periodStart} – ${periodEnd}`,
    );
  }

  if (event.employee_name) {
    lines.push(`Employee: ${event.employee_name}`);
  }

  if (event.leave_type_name) {
    lines.push(`Leave type: ${event.leave_type_name}`);
  }

  if (event.approval_status) {
    lines.push(`Status: ${event.approval_status}`);
  }

  if (event.notes) {
    lines.push(`Notes: ${event.notes}`);
  }

  if (!canEditEvent(event)) {
    lines.push('View only');
  }

  return lines;
}

export function eventTooltipText(
  event: CalendarEntry,
  typeLabels: Record<CalendarType, string>,
): string {
  return eventTooltipLines(event, typeLabels).join('\n');
}

export function normalizeDateRange(start: string, end: string): { start: string; end: string } {
  return start <= end ? { start, end } : { start: end, end: start };
}

export function enumerateDateRange(start: string, end: string): string[] {
  const { start: rangeStart, end: rangeEnd } = normalizeDateRange(start, end);
  const dates: string[] = [];
  let current = date.extractDate(rangeStart, 'YYYY-MM-DD');
  const last = date.extractDate(rangeEnd, 'YYYY-MM-DD');

  while (current <= last) {
    dates.push(date.formatDate(current, 'YYYY-MM-DD'));
    current = date.addToDate(current, { days: 1 });
  }

  return dates;
}

export function clipDateRangeToFuture(
  start: string,
  end: string,
): { start: string; end: string } | null {
  const today = todayDateString();
  const normalized = normalizeDateRange(start, end);

  if (normalized.end < today) {
    return null;
  }

  return {
    start: normalized.start < today ? today : normalized.start,
    end: normalized.end,
  };
}

export function dateFromDayPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const typed = payload as { scope?: { timestamp?: { date?: string } } };
  return typed.scope?.timestamp?.date ?? null;
}

type RawCalendarRecord = Record<string, unknown> & {
  id?: string;
  startDate?: string;
  endDate?: string;
  date?: string;
  startTime?: string | null;
  endTime?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  employeeId?: string | null;
  employee_id?: string | null;
  employmentDetailId?: string | null;
  employment_detail_id?: string | null;
  employment_contract_label?: string | null;
  employeeCompensationId?: string | null;
  employee_compensation_id?: string | null;
  compensation_label?: string | null;
  employee?: { firstName?: string; lastName?: string } | null;
  departmentId?: number | null;
  department_id?: number | null;
  department?: { id?: number; name?: string } | null;
  worksiteId?: number | null;
  worksite_id?: number | null;
  worksite?: { id?: number; name?: string } | null;
  includeLunchHour?: boolean | null;
  include_lunch_hour?: boolean | null;
  lunchHourHours?: number | null;
  lunch_hour_hours?: number | null;
  type?: CalendarEntry['type'];
  description?: string;
  rate?: string | number | null;
  calendar_group_id?: string | null;
};

function calendarRecordDateValue(value: unknown): string {
  if (value == null || value === '') {
    return '';
  }

  if (typeof value === 'string') {
    return value;
  }

  return '';
}

function calendarRecordOptionalString(value: unknown): string | null | undefined {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    return value;
  }

  return undefined;
}

/** Expand a scheduled work API record into daily scheduler events. */
export function scheduledWorkRecordToEvents(record: RawCalendarRecord): CalendarEntry[] {
  const scheduledWorkId = calendarRecordOptionalString(record.id) ?? '';
  if (!scheduledWorkId) {
    return [];
  }

  const startDate = calendarRecordDateValue(
    record.startDate ?? record.start_date ?? record.date,
  );
  const endDate = calendarRecordDateValue(record.endDate ?? record.end_date ?? startDate);
  if (!startDate) {
    return [];
  }

  const startTime =
    formatCalendarTime(calendarRecordOptionalString(record.startTime ?? record.start_time)) || null;
  const endTime =
    formatCalendarTime(calendarRecordOptionalString(record.endTime ?? record.end_time)) || null;

  const employeeId = calendarRecordOptionalString(record.employeeId ?? record.employee_id);
  const employmentDetailId = calendarRecordOptionalString(
    record.employmentDetailId ?? record.employment_detail_id,
  );
  const employeeCompensationId = calendarRecordOptionalString(
    record.employeeCompensationId ?? record.employee_compensation_id,
  );
  const employee = record.employee;
  const employeeName = employee
    ? `${employee.firstName ?? ''} ${employee.lastName ?? ''}`.trim() || null
    : null;

  const departmentId = record.departmentId ?? record.department_id ?? record.department?.id ?? null;
  const departmentName = record.department?.name ?? null;
  const worksiteId = record.worksiteId ?? record.worksite_id ?? record.worksite?.id ?? null;
  const worksiteName = record.worksite?.name ?? null;
  const includeLunchHour = Boolean(record.includeLunchHour ?? record.include_lunch_hour ?? false);
  const lunchHourHours = Number(record.lunchHourHours ?? record.lunch_hour_hours ?? 1);

  return enumerateDateRange(startDate, endDate).map((day) => ({
    id: `scheduled-work-${scheduledWorkId}-${day}`,
    scheduled_work_id: scheduledWorkId,
    date: day,
    description: calendarRecordOptionalString(record.description) ?? '',
    type: 'work',
    rate: record.rate ?? 1,
    source: 'scheduled_work',
    employee_id: employeeId ?? null,
    employee_name: employeeName,
    employment_detail_id: employmentDetailId ?? null,
    employment_contract_label: calendarRecordOptionalString(record.employment_contract_label) ?? null,
    employee_compensation_id: employeeCompensationId ?? null,
    compensation_label: calendarRecordOptionalString(record.compensation_label) ?? null,
    department_id: departmentId != null ? Number(departmentId) : null,
    department_name: departmentName,
    worksite_id: worksiteId != null ? Number(worksiteId) : null,
    worksite_name: worksiteName,
    include_lunch_hour: includeLunchHour,
    lunch_hour_hours: includeLunchHour ? lunchHourHours : null,
    start_date: startDate,
    end_date: endDate,
    start_time: startTime,
    end_time: endTime,
  }));
}

/** @deprecated Use scheduledWorkRecordToEvents */
export function calendarRecordToSchedulerEvents(record: RawCalendarRecord): CalendarEntry[] {
  return scheduledWorkRecordToEvents(record);
}
