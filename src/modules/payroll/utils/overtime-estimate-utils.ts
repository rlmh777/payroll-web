import type { CalendarEntry } from '@hr/stores/calendar-store';
import type { Department } from '@hr/stores/department-store';
import { normalizeCompensationMethod } from '@payroll/components/employee/compensation/compensation-form';
import { compensationAllowsOvertime } from '@payroll/utils/compensation-pay-utils';
import { eventsForCell, shiftPaidHours, type SchedulerGridRow } from '@hr/utils/scheduler-utils';

export type OvertimeThresholdMode = 'DAILY' | 'WEEKLY' | 'DAILY_AND_WEEKLY';

export interface OvertimeEstimate {
  regularHours: number;
  overtimeHours: number;
  totalHours: number;
}

export interface DepartmentOtSettings {
  dailyThreshold: number;
  weeklyThreshold: number;
  mode: OvertimeThresholdMode;
}

export function departmentOtSettings(department?: Pick<
  Department,
  | 'totalDailyHoursBeforeOvertime'
  | 'totalWeeklyHoursBeforeOvertime'
  | 'overtimeThresholdMode'
  | 'includeLunchHour'
  | 'lunchHourHours'
> | null): DepartmentOtSettings {
  const mode = String(department?.overtimeThresholdMode ?? 'DAILY_AND_WEEKLY').toUpperCase();

  return {
    dailyThreshold: Number(department?.totalDailyHoursBeforeOvertime ?? 9) || 9,
    weeklyThreshold: Number(department?.totalWeeklyHoursBeforeOvertime ?? 45) || 45,
    mode: mode === 'WEEKLY' || mode === 'DAILY' ? mode : 'DAILY_AND_WEEKLY',
  };
}

function lunchHoursForDayEvents(
  dayEvents: CalendarEntry[],
  department?: Pick<Department, 'includeLunchHour' | 'lunchHourHours'> | null,
): number {
  if (dayEvents.length === 0) {
    return 0;
  }

  const eventWithLunch = dayEvents.find((event) => event.include_lunch_hour === true);
  if (eventWithLunch) {
    const hours = Number(eventWithLunch.lunch_hour_hours ?? 1);

    return Number.isFinite(hours) && hours > 0 ? hours : 1;
  }

  if (department?.includeLunchHour) {
    const hours = Number(department.lunchHourHours ?? 1);

    return Number.isFinite(hours) && hours > 0 ? hours : 1;
  }

  if (department?.includeLunchHour === false) {
    return 0;
  }

  const includesLunchFromEvents = dayEvents.some(
    (event) => event.include_lunch_hour === true || event.include_lunch_hour === null,
  );

  if (!includesLunchFromEvents) {
    return 0;
  }

  const raw = dayEvents.find((event) => event.lunch_hour_hours != null)?.lunch_hour_hours ?? 1;
  const hours = Number(raw);

  return Number.isFinite(hours) && hours > 0 ? hours : 1;
}

function dayNetHours(dayEvents: CalendarEntry[]): number {
  return roundHours(dayEvents.reduce((sum, event) => sum + shiftPaidHours(event), 0));
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

export function estimateScheduledOvertimeForRow(
  events: CalendarEntry[],
  row: SchedulerGridRow,
  days: string[],
  compensationMethod?: string | null,
  department?: Pick<
    Department,
    | 'totalDailyHoursBeforeOvertime'
    | 'totalWeeklyHoursBeforeOvertime'
    | 'overtimeThresholdMode'
    | 'includeLunchHour'
    | 'lunchHourHours'
  > | null,
): OvertimeEstimate | null {
  const method = normalizeCompensationMethod(compensationMethod);
  if (!compensationAllowsOvertime(method)) {
    if (method === 'BASE_NO_OT') {
      const settings = departmentOtSettings(department);
      const regularHours = roundHours(
        days.reduce((sum, day) => {
          const dayEvents = eventsForCell(events, row, day);
          if (dayEvents.length === 0) {
            return sum;
          }

          return sum + Math.max(0, settings.dailyThreshold - lunchHoursForDayEvents(dayEvents, department));
        }, 0),
      );

      return {
        regularHours,
        overtimeHours: 0,
        totalHours: regularHours,
      };
    }

    const totalHours = roundHours(
      days.reduce((sum, day) => {
        return sum + eventsForCell(events, row, day).reduce((daySum, event) => daySum + shiftPaidHours(event), 0);
      }, 0),
    );

    return {
      regularHours: totalHours,
      overtimeHours: 0,
      totalHours,
    };
  }

  const settings = departmentOtSettings(department);
  const isBaseOt = method === 'BASE_OT';
  const dayRows: Array<{ date: string; netHours: number; lunchHours: number; scheduledHours: number }> = [];

  for (const day of days) {
    const dayEvents = eventsForCell(events, row, day);
    const netHours = dayNetHours(dayEvents);

    if (netHours <= 0) {
      continue;
    }

    dayRows.push({
      date: day,
      netHours,
      lunchHours: lunchHoursForDayEvents(dayEvents, department),
      scheduledHours: netHours,
    });
  }

  if (dayRows.length === 0) {
    return {
      regularHours: 0,
      overtimeHours: 0,
      totalHours: 0,
    };
  }

  let regularHours = 0;
  let overtimeHours = 0;

  if (settings.mode === 'WEEKLY') {
    for (const day of dayRows) {
      regularHours += day.netHours;
    }
    regularHours = roundHours(regularHours);
  } else {
    for (const day of dayRows) {
      const dailyThreshold = isBaseOt
        ? day.scheduledHours
        : Math.max(0, roundHours(settings.dailyThreshold - day.lunchHours));
      const dayRegular = roundHours(Math.min(day.netHours, dailyThreshold));
      const dayOvertime = roundHours(Math.max(0, day.netHours - dayRegular));

      regularHours = roundHours(regularHours + dayRegular);
      overtimeHours = roundHours(overtimeHours + dayOvertime);
    }

    if (settings.mode === 'DAILY_AND_WEEKLY') {
      const lunchDeduction = roundHours(dayRows.reduce((sum, day) => sum + day.lunchHours, 0));
      const weeklyThreshold = Math.max(0, roundHours(settings.weeklyThreshold - lunchDeduction));
      const weeklyExcess = roundHours(Math.max(0, regularHours - weeklyThreshold));

      if (weeklyExcess > 0) {
        regularHours = roundHours(regularHours - weeklyExcess);
        overtimeHours = roundHours(overtimeHours + weeklyExcess);
      }
    }
  }

  if (settings.mode === 'WEEKLY') {
    const lunchDeduction = roundHours(dayRows.reduce((sum, day) => sum + day.lunchHours, 0));
    const weeklyThreshold = Math.max(0, roundHours(settings.weeklyThreshold - lunchDeduction));
    const weeklyExcess = roundHours(Math.max(0, regularHours - weeklyThreshold));

    regularHours = roundHours(regularHours - weeklyExcess);
    overtimeHours = roundHours(weeklyExcess);
  }

  return {
    regularHours,
    overtimeHours,
    totalHours: roundHours(regularHours + overtimeHours),
  };
}

export function aggregateTimesheetOvertime(
  rows: Array<{ regularHours?: number | null; overtimeHours?: number | null; hoursWorked?: number | null }>,
): OvertimeEstimate {
  const regularHours = roundHours(rows.reduce((sum, row) => sum + Number(row.regularHours ?? 0), 0));
  const overtimeHours = roundHours(rows.reduce((sum, row) => sum + Number(row.overtimeHours ?? 0), 0));
  const totalHours = roundHours(rows.reduce((sum, row) => sum + Number(row.hoursWorked ?? 0), 0));

  return { regularHours, overtimeHours, totalHours };
}
