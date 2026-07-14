export const WEEKDAY_OPTIONS = [
  { label: 'Mon', value: 'Mon' },
  { label: 'Tue', value: 'Tue' },
  { label: 'Wed', value: 'Wed' },
  { label: 'Thu', value: 'Thu' },
  { label: 'Fri', value: 'Fri' },
  { label: 'Sat', value: 'Sat' },
  { label: 'Sun', value: 'Sun' },
] as const;

export type WeekdayCode = (typeof WEEKDAY_OPTIONS)[number]['value'];

export type ScheduleMode = 'single' | 'series';

export type EmployeeScheduleForm = {
  employeeId: string | null;
  employmentDetailId: string | null;
  departmentId: number | null;
  mode: ScheduleMode;
  date: string;
  startDate: string;
  endDate: string;
  days: WeekdayCode[];
  startTime: string;
  endTime: string;
  includeLunchHour: boolean;
  lunchHourHours: number;
};

export type ScheduleEventContext = {
  scheduleId: string;
  seriesId?: string | null;
  employeeId?: string | null;
  employmentDetailId?: string | null;
  departmentId?: number | null;
  date: string;
  startDate?: string;
  endDate?: string;
  days?: WeekdayCode[];
  startTime?: string | null;
  endTime?: string | null;
  includeLunchHour?: boolean;
  lunchHourHours?: number;
};

export function createDefaultScheduleForm(date = ''): EmployeeScheduleForm {
  return {
    employeeId: null,
    employmentDetailId: null,
    departmentId: null,
    mode: 'single',
    date,
    startDate: date,
    endDate: date,
    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: '08:00',
    endTime: '17:00',
    includeLunchHour: false,
    lunchHourHours: 1,
  };
}

export function scheduleFormFromEvent(event: ScheduleEventContext): EmployeeScheduleForm {
  return {
    employeeId: event.employeeId ?? null,
    employmentDetailId: event.employmentDetailId ?? null,
    departmentId: event.departmentId ?? null,
    mode: event.seriesId ? 'series' : 'single',
    date: event.date,
    startDate: event.startDate ?? event.date,
    endDate: event.endDate ?? event.date,
    days: event.days?.length ? [...event.days] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    startTime: normalizeTime(event.startTime ?? '08:00'),
    endTime: normalizeTime(event.endTime ?? '17:00'),
    includeLunchHour: Boolean(event.includeLunchHour),
    lunchHourHours: event.lunchHourHours ?? 1,
  };
}

export function normalizeTime(value: string): string {
  if (!value) return '08:00';
  return value.slice(0, 5);
}

export function validateScheduleForm(form: EmployeeScheduleForm): string | null {
  if (!form.employeeId) return 'Employee is required.';
  if (!form.departmentId) return 'Department is required.';
  if (!form.startTime || !form.endTime) return 'Start and end times are required.';
  if (form.endTime <= form.startTime) return 'End time must be after start time.';

  if (form.mode === 'single' && !form.date) {
    return 'Date is required.';
  }

  if (form.mode === 'series') {
    if (!form.startDate || !form.endDate) return 'Start and end dates are required.';
    if (form.endDate < form.startDate) return 'End date must be on or after start date.';
    if (!form.days.length) return 'Select at least one weekday.';
  }

  return null;
}

export type ScheduleCreatePayload = {
  employeeId: string;
  employmentDetailId?: string | null;
  departmentId?: number | null;
  mode: ScheduleMode;
  date?: string;
  startDate?: string;
  endDate?: string;
  days?: WeekdayCode[];
  startTime: string;
  endTime: string;
  include_lunch_hour?: boolean;
  lunch_hour_hours?: number;
};

export function scheduleFormToCreatePayload(form: EmployeeScheduleForm): ScheduleCreatePayload {
  const payload: ScheduleCreatePayload = {
    employeeId: form.employeeId as string,
    employmentDetailId: form.employmentDetailId,
    departmentId: form.departmentId,
    mode: form.mode,
    startTime: form.startTime,
    endTime: form.endTime,
    include_lunch_hour: form.includeLunchHour,
    ...(form.includeLunchHour ? { lunch_hour_hours: form.lunchHourHours } : {}),
  };

  if (form.mode === 'single') {
    payload.date = form.date;
  } else {
    payload.startDate = form.startDate;
    payload.endDate = form.endDate;
    payload.days = form.days;
  }

  return payload;
}

export function scheduleFormToUpdatePayload(
  form: EmployeeScheduleForm,
  scope: 'single' | 'series',
  includeSeriesDates = false,
) {
  return {
    scope,
    employmentDetailId: form.employmentDetailId,
    departmentId: form.departmentId,
    startTime: form.startTime,
    endTime: form.endTime,
    include_lunch_hour: form.includeLunchHour,
    ...(form.includeLunchHour ? { lunch_hour_hours: form.lunchHourHours } : {}),
    ...(scope === 'single' ? { date: form.date } : {}),
    ...(scope === 'series' && includeSeriesDates
      ? {
          startDate: form.startDate,
          endDate: form.endDate,
          days: form.days,
        }
      : {}),
  };
}
