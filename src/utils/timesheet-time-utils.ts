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
