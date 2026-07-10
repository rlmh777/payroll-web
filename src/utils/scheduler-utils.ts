import { date } from 'quasar';
import type { CalendarEntry, CalendarEmployee } from 'src/stores/calendar-store';
import type { Department } from 'src/stores/department-store';
import { getActiveEmploymentCompensation, type EmploymentCompensation } from './calendar-employment-utils';
import {
  compensationAllowsOvertime,
  effectiveHourlyRateFromCompensation,
  expectedShiftPayoutAmount,
  normalizeCompensationMethod,
} from './compensation-pay-utils';

export { todayDateString } from './calendar-event-utils';

export type SchedulerViewMode = 'day' | 'week';

export type SchedulerViewBy = 'users' | 'department';

export type SchedulerSortBy = 'firstName' | 'lastName';

export type SchedulerRowKind = 'employee' | 'department-header';

export interface SchedulerGridRow {
  key: string;
  rowKind: SchedulerRowKind;
  type: SchedulerViewBy;
  id: string;
  label: string;
  subtitle?: string;
  employee?: CalendarEmployee;
  departmentId?: number | null;
}

export interface SchedulerEmployeeColor {
  main: string;
  light: string;
  border: string;
  text: string;
}

const SCHEDULER_EMPLOYEE_PALETTE: SchedulerEmployeeColor[] = [
  { main: '#1976D2', light: '#E3F2FD', border: '#1565C0', text: '#0D47A1' },
  { main: '#00897B', light: '#E0F2F1', border: '#00695C', text: '#004D40' },
  { main: '#7B1FA2', light: '#F3E5F5', border: '#6A1B9A', text: '#4A148C' },
  { main: '#E65100', light: '#FFF3E0', border: '#EF6C00', text: '#BF360C' },
  { main: '#C2185B', light: '#FCE4EC', border: '#AD1457', text: '#880E4F' },
  { main: '#455A64', light: '#ECEFF1', border: '#37474F', text: '#263238' },
  { main: '#558B2F', light: '#F1F8E9', border: '#33691E', text: '#1B5E20' },
  { main: '#6A1B9A', light: '#EDE7F6', border: '#4A148C', text: '#311B92' },
  { main: '#0277BD', light: '#E1F5FE', border: '#01579B', text: '#01579B' },
  { main: '#AD1457', light: '#FCE4EC', border: '#880E4F', text: '#560027' },
  { main: '#283593', light: '#E8EAF6', border: '#1A237E', text: '#1A237E' },
  { main: '#F57F17', light: '#FFF8E1', border: '#F9A825', text: '#F57F17' },
  { main: '#00695C', light: '#E0F7FA', border: '#004D40', text: '#004D40' },
  { main: '#5D4037', light: '#EFEBE9', border: '#4E342E', text: '#3E2723' },
  { main: '#512DA8', light: '#EDE7F6', border: '#4527A0', text: '#311B92' },
  { main: '#1565C0', light: '#E3F2FD', border: '#0D47A1', text: '#0D47A1' },
];

function hashEmployeeId(employeeId: string): number {
  let hash = 0;

  for (let index = 0; index < employeeId.length; index += 1) {
    hash = (hash << 5) - hash + employeeId.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export function schedulerEmployeeColor(employeeId: string | null | undefined): SchedulerEmployeeColor {
  if (!employeeId) {
    return SCHEDULER_EMPLOYEE_PALETTE[0] ?? {
      main: '#1976D2',
      light: '#E3F2FD',
      border: '#1565C0',
      text: '#0D47A1',
    };
  }

  const paletteIndex = hashEmployeeId(employeeId) % SCHEDULER_EMPLOYEE_PALETTE.length;
  return SCHEDULER_EMPLOYEE_PALETTE[paletteIndex] ?? SCHEDULER_EMPLOYEE_PALETTE[0]!;
}

export function getWeekDays(anchorDate: string): string[] {
  const parsed = date.extractDate(anchorDate, 'YYYY-MM-DD');
  const dayOfWeek = parsed.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = date.addToDate(parsed, { days: mondayOffset });

  return Array.from({ length: 7 }, (_, index) =>
    date.formatDate(date.addToDate(monday, { days: index }), 'YYYY-MM-DD'),
  );
}

export function getVisibleDays(viewMode: SchedulerViewMode, anchorDate: string): string[] {
  return viewMode === 'day' ? [anchorDate] : getWeekDays(anchorDate);
}

export function getDateRangeForView(viewMode: SchedulerViewMode, anchorDate: string): {
  start: string;
  end: string;
} {
  const days = getVisibleDays(viewMode, anchorDate);
  return { start: days[0] ?? anchorDate, end: days[days.length - 1] ?? anchorDate };
}

export function formatSchedulerDayHeader(day: string): { weekday: string; date: string } {
  const parsed = date.extractDate(day, 'YYYY-MM-DD');
  return {
    weekday: date.formatDate(parsed, 'ddd').toUpperCase(),
    date: String(parsed.getDate()),
  };
}

export function formatSchedulerPeriodLabel(
  viewMode: SchedulerViewMode,
  anchorDate: string,
): string {
  const days = getVisibleDays(viewMode, anchorDate);
  if (!days.length) {
    return '';
  }

  if (viewMode === 'day') {
    const day = days[0];
    if (!day) {
      return '';
    }
    const parsed = date.extractDate(day, 'YYYY-MM-DD');
    return date.formatDate(parsed, 'dddd, MMMM D, YYYY');
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

type CalendarEventFields = CalendarEntry & {
  startTime?: string | null;
  endTime?: string | null;
  employeeId?: string | null;
  startDate?: string | null;
  includeLunchHour?: boolean | null;
};

function calendarEventDay(event: CalendarEntry): string {
  const raw = event as CalendarEventFields;
  return event.date ?? raw.startDate ?? event.start_date ?? '';
}

function calendarEventEmployeeId(event: CalendarEntry): string | null {
  const raw = event as CalendarEventFields;
  return event.employee_id ?? raw.employeeId ?? null;
}

function calendarEventStartTime(event: CalendarEntry): string | null {
  const raw = event as CalendarEventFields;
  const value = event.start_time ?? raw.startTime;
  return value ? value.slice(0, 5) : null;
}

function calendarEventEndTime(event: CalendarEntry): string | null {
  const raw = event as CalendarEventFields;
  const value = event.end_time ?? raw.endTime;
  return value ? value.slice(0, 5) : null;
}

function calendarEventIncludesLunch(event: CalendarEntry): boolean {
  const raw = event as CalendarEventFields;
  return Boolean(event.include_lunch_hour ?? raw.includeLunchHour ?? false);
}

export function formatShiftTime(event: CalendarEntry): string {
  const start = calendarEventStartTime(event);
  const end = calendarEventEndTime(event);

  if (start && end) {
    return `${start} – ${end}`;
  }

  return start || end || '';
}

export function employeeDisplayName(employee: CalendarEmployee): string {
  return `${employee.firstName} ${employee.lastName}`.trim();
}

export function filterEmployeesByName(
  employees: CalendarEmployee[],
  search: string,
): CalendarEmployee[] {
  const query = search.trim().toLowerCase();
  if (!query) {
    return employees;
  }

  return employees.filter((employee) => {
    const name = employeeDisplayName(employee).toLowerCase();
    const code = employee.code?.toLowerCase() ?? '';
    return name.includes(query) || code.includes(query);
  });
}

export function sortEmployees(
  employees: CalendarEmployee[],
  sortBy: SchedulerSortBy,
): CalendarEmployee[] {
  return [...employees].sort((left, right) => {
    const leftKey = (sortBy === 'firstName' ? left.firstName : left.lastName).toLowerCase();
    const rightKey = (sortBy === 'firstName' ? right.firstName : right.lastName).toLowerCase();
    const compare = leftKey.localeCompare(rightKey, undefined, { sensitivity: 'base' });

    if (compare !== 0) {
      return compare;
    }

    const leftSecondary = (sortBy === 'firstName' ? left.lastName : left.firstName).toLowerCase();
    const rightSecondary = (sortBy === 'firstName' ? right.lastName : right.firstName).toLowerCase();
    return leftSecondary.localeCompare(rightSecondary, undefined, { sensitivity: 'base' });
  });
}

export function buildEmployeeGridRows(
  employees: CalendarEmployee[],
  sortBy: SchedulerSortBy,
): SchedulerGridRow[] {
  return sortEmployees(employees, sortBy).map((employee) => ({
    key: `employee-${employee.id}`,
    rowKind: 'employee' as const,
    type: 'users' as const,
    id: employee.id,
    label: employeeDisplayName(employee),
    subtitle: employee.code ?? '',
    employee,
  }));
}

export interface DepartmentGroup {
  departmentId: number;
  departmentName: string;
  employees: CalendarEmployee[];
}

export function groupEmployeesByDepartment(
  employees: CalendarEmployee[],
  departmentNameById: Map<number, string>,
  getDepartmentId: (employee: CalendarEmployee) => number | null,
): DepartmentGroup[] {
  const groups = new Map<number, DepartmentGroup>();
  const unassigned: CalendarEmployee[] = [];

  for (const employee of employees) {
    const departmentId = getDepartmentId(employee);
    if (departmentId == null) {
      unassigned.push(employee);
      continue;
    }

    const existing = groups.get(departmentId);
    if (existing) {
      existing.employees.push(employee);
      continue;
    }

    groups.set(departmentId, {
      departmentId,
      departmentName: departmentNameById.get(departmentId) ?? `Department ${departmentId}`,
      employees: [employee],
    });
  }

  const sortedGroups = [...groups.values()].sort((left, right) =>
    left.departmentName.localeCompare(right.departmentName, undefined, { sensitivity: 'base' }),
  );

  if (unassigned.length) {
    sortedGroups.push({
      departmentId: 0,
      departmentName: 'Unassigned',
      employees: unassigned,
    });
  }

  return sortedGroups;
}

export function buildDepartmentGroupedGridRows(
  employees: CalendarEmployee[],
  sortBy: SchedulerSortBy,
  departmentNameById: Map<number, string>,
  getDepartmentId: (employee: CalendarEmployee) => number | null,
): SchedulerGridRow[] {
  const rows: SchedulerGridRow[] = [];
  const groups = groupEmployeesByDepartment(employees, departmentNameById, getDepartmentId);

  for (const group of groups) {
    rows.push({
      key: `department-header-${group.departmentId}`,
      rowKind: 'department-header',
      type: 'department',
      id: String(group.departmentId),
      label: group.departmentName,
      departmentId: group.departmentId,
    });
    rows.push(...buildEmployeeGridRows(group.employees, sortBy));
  }

  return rows;
}

export function employeeInitials(employee: CalendarEmployee): string {
  const first = employee.firstName?.charAt(0) ?? '';
  const last = employee.lastName?.charAt(0) ?? '';
  return `${first}${last}`.toUpperCase() || '?';
}

export function eventsForCell(
  events: CalendarEntry[],
  row: SchedulerGridRow,
  day: string,
): CalendarEntry[] {
  if (row.rowKind === 'department-header') {
    return [];
  }

  return events.filter((event) => {
    if (calendarEventDay(event) !== day || event.type !== 'work') {
      return false;
    }

    return calendarEventEmployeeId(event) === row.id;
  });
}

export function scheduledEmployeeIds(events: CalendarEntry[], days: string[]): Set<string> {
  const ids = new Set<string>();

  for (const event of events) {
    if (event.type !== 'work' || !event.employee_id || !days.includes(event.date)) {
      continue;
    }

    ids.add(event.employee_id);
  }

  return ids;
}

export function scheduledDepartmentIds(events: CalendarEntry[], days: string[]): Set<string> {
  const ids = new Set<string>();

  for (const event of events) {
    if (event.type !== 'work' || event.department_id == null || !days.includes(event.date)) {
      continue;
    }

    ids.add(String(event.department_id));
  }

  return ids;
}

function calendarEventLunchMinutes(event: CalendarEntry): number {
  if (!calendarEventIncludesLunch(event)) {
    return 0;
  }

  const raw = event as CalendarEventFields & {
    lunch_hour_hours?: number | null;
    lunchHourHours?: number | null;
  };
  const hours = Number(event.lunch_hour_hours ?? raw.lunchHourHours ?? 1);

  return Number.isFinite(hours) && hours > 0 ? Math.round(hours * 60) : 60;
}

export function shiftPaidMinutes(event: CalendarEntry): number {
  const start = calendarEventStartTime(event);
  const end = calendarEventEndTime(event);

  if (!start || !end) {
    return 0;
  }

  const [startHour = 0, startMinute = 0] = start.split(':').map(Number);
  const [endHour = 0, endMinute = 0] = end.split(':').map(Number);
  let minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);

  if (minutes <= 0) {
    return 0;
  }

  if (calendarEventIncludesLunch(event)) {
    minutes = Math.max(0, minutes - calendarEventLunchMinutes(event));
  }

  return minutes;
}

export function shiftPaidHours(event: CalendarEntry): number {
  return Math.round((shiftPaidMinutes(event) / 60) * 10) / 10;
}

export function effectiveHourlyRate(compensation: EmploymentCompensation): number | null {
  return effectiveHourlyRateFromCompensation(compensation);
}

export function expectedShiftPayout(
  event: CalendarEntry,
  compensation: EmploymentCompensation | null,
): number {
  if (!compensation) {
    return 0;
  }

  const hours = shiftPaidMinutes(event) / 60;
  if (hours <= 0) {
    return 0;
  }

  const multiplier = Number(event.rate ?? 1);
  const rateFactor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;

  return expectedShiftPayoutAmount(compensation, hours, rateFactor);
}

export function schedulerShowsOvertimeEstimate(compensation: EmploymentCompensation | null): boolean {
  if (!compensation) {
    return false;
  }

  return compensationAllowsOvertime(compensation.compensationMethod);
}

export function expectedPayoutForRow(
  events: CalendarEntry[],
  row: SchedulerGridRow,
  days: string[],
  employee?: CalendarEmployee | null,
  department?: Pick<
    Department,
    'totalDailyHoursBeforeOvertime' | 'includeLunchHour' | 'lunchHourHours'
  > | null,
): number | null {
  if (row.rowKind === 'department-header') {
    return null;
  }

  const compensation = employee ? getActiveEmploymentCompensation(employee) : null;
  if (!compensation || !effectiveHourlyRate(compensation)) {
    return null;
  }

  let total = 0;
  const method = normalizeCompensationMethod(compensation.compensationMethod);

  if (method === 'BASE_NO_OT') {
    for (const day of days) {
      const dayEvents = eventsForCell(events, row, day);
      const dayHours = dayEvents.map((event) => shiftPaidMinutes(event) / 60);
      const totalDayHours = dayHours.reduce((sum, hours) => sum + hours, 0);
      const dailyPayableCap = dailyBasePayableHours(dayEvents, department);
      const shortfall = Math.max(0, dailyPayableCap - totalDayHours);
      let remainingPayable = dailyPayableCap;

      for (const [index, event] of dayEvents.entries()) {
        if (remainingPayable <= 0) {
          break;
        }

        const hours = dayHours[index] ?? 0;
        const payableHours = Math.min(
          hours + (index === dayEvents.length - 1 ? shortfall : 0),
          remainingPayable,
        );
        const multiplier = Number(event.rate ?? 1);
        const rateFactor = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;

        total += expectedShiftPayoutAmount(compensation, payableHours, rateFactor);
        remainingPayable = Math.max(0, remainingPayable - payableHours);
      }
    }

    return Math.round(total * 100) / 100;
  }

  for (const day of days) {
    for (const event of eventsForCell(events, row, day)) {
      total += expectedShiftPayout(event, compensation);
    }
  }

  return Math.round(total * 100) / 100;
}

function dailyBasePayableHours(
  dayEvents: CalendarEntry[],
  department?: Pick<Department, 'totalDailyHoursBeforeOvertime' | 'includeLunchHour' | 'lunchHourHours'> | null,
): number {
  if (dayEvents.length === 0) {
    return 0;
  }

  const threshold = Number(department?.totalDailyHoursBeforeOvertime ?? 9) || 9;
  const eventWithLunch = dayEvents.find((event) => event.include_lunch_hour === true);
  const lunchHours = eventWithLunch
    ? Number(eventWithLunch.lunch_hour_hours ?? 1) || 1
    : department?.includeLunchHour
      ? Number(department.lunchHourHours ?? 1) || 1
      : 0;

  return Math.max(0, Math.round((threshold - lunchHours) * 100) / 100);
}

export function formatSchedulerPayout(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function effectiveHourlyRateForEmployee(
  employee?: CalendarEmployee | null,
): number | null {
  if (!employee) {
    return null;
  }

  const compensation = getActiveEmploymentCompensation(employee);
  if (!compensation) {
    return null;
  }

  return effectiveHourlyRate(compensation);
}

export function formatSchedulerHourlyRate(amount: number): string {
  return `${formatSchedulerPayout(amount)}/hr`;
}

export function shiftHoursForRow(events: CalendarEntry[], row: SchedulerGridRow, days: string[]): number {
  if (row.rowKind === 'department-header') {
    return 0;
  }

  let totalMinutes = 0;

  for (const day of days) {
    for (const event of eventsForCell(events, row, day)) {
      totalMinutes += shiftPaidMinutes(event);
    }
  }

  return Math.round((totalMinutes / 60) * 10) / 10;
}
