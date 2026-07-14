export const WORK_TIMESHEET_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export interface TimesheetTemplateDaySchedule {
  day: string;
  start_time: string;
  end_time: string;
  include_lunch_hour: boolean;
  lunch_hour_hours?: number | null;
  department_id?: number | null;
}

export interface TimesheetTemplateSlot {
  id: string;
  startTime: string;
  endTime: string;
  includeLunchHour: boolean;
  lunchHourHours: number;
  departmentId: number | null;
}

export interface TimesheetTemplateDayGroup {
  day: string;
  enabled: boolean;
  slots: TimesheetTemplateSlot[];
}

export interface TimesheetTemplateForm {
  name: string;
  dayGroups: TimesheetTemplateDayGroup[];
}

export function normalizeTime(value: string) {
  return value.slice(0, 5);
}

let slotIdCounter = 0;

export function createSlotId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  slotIdCounter += 1;
  return `slot-${Date.now()}-${slotIdCounter}`;
}

export function createSlot(overrides: Partial<TimesheetTemplateSlot> = {}): TimesheetTemplateSlot {
  return {
    id: createSlotId(),
    startTime: '08:00',
    endTime: '17:00',
    includeLunchHour: true,
    lunchHourHours: 1,
    departmentId: overrides.departmentId ?? null,
    ...overrides,
  };
}

export function createDefaultDayGroups(defaultDepartmentId?: number | null): TimesheetTemplateDayGroup[] {
  return WORK_TIMESHEET_DAYS.map((day) => {
    const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day);

    return {
      day,
      enabled: isWeekday,
      slots: isWeekday ? [createSlot({ departmentId: defaultDepartmentId ?? null })] : [],
    };
  });
}

export function schedulesFromLegacy(
  startTime: string,
  endTime: string,
  days: string[],
): TimesheetTemplateDaySchedule[] {
  return days.map((day) => ({
    day,
    start_time: normalizeTime(startTime),
    end_time: normalizeTime(endTime),
    include_lunch_hour: true,
    lunch_hour_hours: 1,
    department_id: null,
  }));
}

export function resolvedSchedules(timesheet: {
  day_schedules?: TimesheetTemplateDaySchedule[];
  start_time: string;
  end_time: string;
  days: string[];
}): TimesheetTemplateDaySchedule[] {
  if (Array.isArray(timesheet.day_schedules) && timesheet.day_schedules.length > 0) {
    return timesheet.day_schedules;
  }

  return schedulesFromLegacy(timesheet.start_time, timesheet.end_time, timesheet.days ?? []);
}

export function timesheetToForm(timesheet: {
  name: string;
  day_schedules?: TimesheetTemplateDaySchedule[];
  start_time: string;
  end_time: string;
  days: string[];
}): TimesheetTemplateForm {
  const schedules = resolvedSchedules(timesheet);

  return {
    name: timesheet.name,
    dayGroups: WORK_TIMESHEET_DAYS.map((day) => {
      const daySchedules = schedules.filter((item) => item.day === day);

      if (daySchedules.length === 0) {
        return {
          day,
          enabled: false,
          slots: [],
        };
      }

      return {
        day,
        enabled: true,
        slots: daySchedules.map((schedule) =>
          createSlot({
            startTime: normalizeTime(schedule.start_time),
            endTime: normalizeTime(schedule.end_time),
            includeLunchHour: schedule.include_lunch_hour ?? true,
            lunchHourHours: schedule.lunch_hour_hours ?? 1,
            departmentId: schedule.department_id ?? null,
          }),
        ),
      };
    }),
  };
}

export function formToPayload(form: TimesheetTemplateForm) {
  const daySchedules = form.dayGroups
    .filter((group) => group.enabled && group.slots.length > 0)
    .flatMap((group) =>
      group.slots
        .filter((slot) => slot.startTime && slot.endTime)
        .map((slot) => ({
          day: group.day,
          start_time: normalizeTime(slot.startTime),
          end_time: normalizeTime(slot.endTime),
          include_lunch_hour: slot.includeLunchHour,
          ...(slot.includeLunchHour ? { lunch_hour_hours: slot.lunchHourHours } : {}),
          department_id: slot.departmentId,
        })),
    );

  return {
    name: form.name.trim(),
    day_schedules: daySchedules,
  };
}

function departmentLabel(
  departmentId: number | null | undefined,
  departmentNames?: Record<number, string>,
) {
  if (!departmentId) {
    return 'No department';
  }

  return departmentNames?.[departmentId] ?? `Dept #${departmentId}`;
}

export function formatScheduleSummary(
  timesheet: {
    day_schedules?: TimesheetTemplateDaySchedule[];
    start_time: string;
    end_time: string;
    days: string[];
  },
  departmentNames?: Record<number, string>,
) {
  const schedules = resolvedSchedules(timesheet);

  if (schedules.length === 0) {
    return 'No days configured';
  }

  return schedules
    .map((item) => {
      const dept = departmentLabel(item.department_id, departmentNames);
      return `${item.day} ${item.start_time}-${item.end_time} (${dept})`;
    })
    .join('; ');
}

export function formatLunchSummary(timesheet: {
  day_schedules?: TimesheetTemplateDaySchedule[];
  start_time: string;
  end_time: string;
  days: string[];
}) {
  const schedules = resolvedSchedules(timesheet);

  if (schedules.length === 0) {
    return '—';
  }

  const slotCount = schedules.length;
  const dayCount = new Set(schedules.map((item) => item.day)).size;

  return `${slotCount} slot${slotCount === 1 ? '' : 's'} across ${dayCount} day${dayCount === 1 ? '' : 's'}`;
}

export function validateTimesheetTemplateForm(form: TimesheetTemplateForm): string | null {
  if (!form.name.trim()) {
    return 'Template name is required.';
  }

  const enabledGroups = form.dayGroups.filter((group) => group.enabled);

  if (enabledGroups.length === 0) {
    return 'Enable at least one day.';
  }

  for (const group of enabledGroups) {
    if (group.slots.length === 0) {
      return `Add at least one time slot for ${group.day}.`;
    }

    for (const slot of group.slots) {
      if (!slot.startTime || !slot.endTime) {
        return `Set start and end times for ${group.day}.`;
      }

      if (!slot.departmentId) {
        return `Select a department for each time slot on ${group.day}.`;
      }
    }
  }

  return null;
}

// Backward-compatible aliases used by older components during transition.
export type TimesheetTemplateDayRow = TimesheetTemplateDayGroup;
export const createDefaultDayRows = createDefaultDayGroups;
