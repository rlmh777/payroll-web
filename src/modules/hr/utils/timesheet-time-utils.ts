export function formatTimesheetClockTime(value?: string | null): string {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

export function toTimeInputValue(value?: string | null): string {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${hours}:${minutes}`;
}

export function combineWorkDateAndTime(workDate: string, timeValue: string): string | null {
  if (!workDate || !timeValue) {
    return null;
  }

  return `${workDate} ${timeValue}:00`;
}

function addDaysToDateString(workDate: string, days: number): string {
  const parsed = new Date(`${workDate}T00:00:00`);
  parsed.setDate(parsed.getDate() + days);

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function buildRoundOffDateTimes(
  workDate: string,
  clockInTime: string,
  clockOutTime: string,
): { roundOffClockInTime: string | null; roundOffClockOutTime: string | null } {
  const roundOffClockInTime = combineWorkDateAndTime(workDate, clockInTime);
  if (!roundOffClockInTime || !clockOutTime) {
    return {
      roundOffClockInTime,
      roundOffClockOutTime: combineWorkDateAndTime(workDate, clockOutTime),
    };
  }

  let outDate = workDate;
  if (clockOutTime <= clockInTime) {
    outDate = addDaysToDateString(workDate, 1);
  }

  return {
    roundOffClockInTime,
    roundOffClockOutTime: combineWorkDateAndTime(outDate, clockOutTime),
  };
}

export interface TimesheetPeriodTotals {
  scheduledHours: number;
  rawClockedHours: number;
  roundedHours: number;
  payableHours: number;
  regularHours: number;
  overtimeHours: number;
  holidayHours: number;
  unpaidHours: number;
  paidHours: number;
  lunchHourHours: number;
}

export function rawClockedHoursForRow(row: {
  rawClockedHours?: number | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
}): number {
  if (row.rawClockedHours !== undefined && row.rawClockedHours !== null) {
    return Number(row.rawClockedHours);
  }

  if (!row.clockInTime || !row.clockOutTime) {
    return 0;
  }

  const clockIn = new Date(row.clockInTime).getTime();
  const clockOut = new Date(row.clockOutTime).getTime();

  if (Number.isNaN(clockIn) || Number.isNaN(clockOut) || clockOut <= clockIn) {
    return 0;
  }

  return Math.round(((clockOut - clockIn) / 3_600_000) * 100) / 100;
}

export function sumTimesheetPeriodTotals(rows: Array<{
  scheduledHours?: number | null;
  rawClockedHours?: number | null;
  clockInTime?: string | null;
  clockOutTime?: string | null;
  clockedHoursWorked?: number | null;
  hoursWorked?: number | null;
  regularHours?: number | null;
  overtimeHours?: number | null;
  holidayHours?: number | null;
  unpaidHours?: number | null;
  paidHours?: number | null;
  lunchHourHours?: number | null;
}>): TimesheetPeriodTotals {
  const initialTotals: TimesheetPeriodTotals = {
    scheduledHours: 0,
    rawClockedHours: 0,
    roundedHours: 0,
    payableHours: 0,
    regularHours: 0,
    overtimeHours: 0,
    holidayHours: 0,
    unpaidHours: 0,
    paidHours: 0,
    lunchHourHours: 0,
  };

  return rows.reduce<TimesheetPeriodTotals>(
    (totals, row) => ({
      scheduledHours: totals.scheduledHours + Number(row.scheduledHours ?? 0),
      rawClockedHours: totals.rawClockedHours + rawClockedHoursForRow(row),
      roundedHours: totals.roundedHours + Number(row.clockedHoursWorked ?? 0),
      payableHours: totals.payableHours + Number(row.hoursWorked ?? 0),
      regularHours: totals.regularHours + Number(row.regularHours ?? 0),
      overtimeHours: totals.overtimeHours + Number(row.overtimeHours ?? 0),
      holidayHours: totals.holidayHours + Number(row.holidayHours ?? 0),
      unpaidHours: totals.unpaidHours + Number(row.unpaidHours ?? 0),
      paidHours: totals.paidHours + Number(row.paidHours ?? 0),
      lunchHourHours: totals.lunchHourHours + Number(row.lunchHourHours ?? 0),
    }),
    initialTotals,
  );
}
