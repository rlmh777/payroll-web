import {
  DEFAULT_STANDARD_WEEKLY_HOURS,
  derivedHourlyRateFromYearly,
  isBaseMethod,
  isHourlyMethod,
  normalizeCompensationMethod,
} from '@payroll/components/employee/compensation/compensation-form';
import type { EmploymentCompensation } from '@hr/utils/calendar-employment-utils';

export function compensationAllowsOvertime(payMethod?: string | null): boolean {
  const method = normalizeCompensationMethod(payMethod);
  return method === 'HOURLY_OT' || method === 'BASE_OT';
}

export { isHourlyMethod, isBaseMethod, normalizeCompensationMethod };

export function effectiveHourlyRateFromCompensation(
  compensation: EmploymentCompensation,
): number | null {
  if (compensation.hourlyRate > 0) {
    return compensation.hourlyRate;
  }

  if (compensation.yearlyRate > 0) {
    const standardWeeklyHours = Number(
      compensation.standardWeeklyHours ?? DEFAULT_STANDARD_WEEKLY_HOURS,
    );
    return derivedHourlyRateFromYearly(compensation.yearlyRate, standardWeeklyHours);
  }

  return null;
}

/**
 * Scheduled shift hours used for payout estimates in the scheduler.
 * Base-rate methods pay scheduled hours; hourly methods estimate from scheduled shifts.
 */
export function expectedPayableHoursForShift(
  compensation: EmploymentCompensation,
  scheduledShiftHours: number,
): number {
  if (scheduledShiftHours <= 0) {
    return 0;
  }

  const method = normalizeCompensationMethod(compensation.compensationMethod);

  if (isBaseMethod(method)) {
    return scheduledShiftHours;
  }

  return scheduledShiftHours;
}

export function expectedShiftPayoutAmount(
  compensation: EmploymentCompensation,
  scheduledShiftHours: number,
  holidayMultiplier = 1,
): number {
  const hourlyRate = effectiveHourlyRateFromCompensation(compensation);
  if (!hourlyRate) {
    return 0;
  }

  const payableHours = expectedPayableHoursForShift(compensation, scheduledShiftHours);
  if (payableHours <= 0) {
    return 0;
  }

  const multiplier = Number.isFinite(holidayMultiplier) && holidayMultiplier > 0
    ? holidayMultiplier
    : 1;

  return Math.round(payableHours * hourlyRate * multiplier * 100) / 100;
}

export function formatOvertimeHours(
  payMethod: string | null | undefined,
  overtimeHours: number | null | undefined,
  formatHours: (value?: number | null) => string,
): string {
  if (!compensationAllowsOvertime(payMethod)) {
    return '—';
  }

  return formatHours(overtimeHours);
}
