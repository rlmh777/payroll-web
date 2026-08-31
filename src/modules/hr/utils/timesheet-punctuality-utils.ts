export type TimesheetPunctualityStatus = 'EARLY' | 'LATE' | 'ON_TIME';
export type TimesheetPunctualitySelection = TimesheetPunctualityStatus | 'AUTO';

export const TIMESHEET_PUNCTUALITY_OPTIONS: Array<{ label: string; value: TimesheetPunctualitySelection }> = [
  { label: 'Auto', value: 'AUTO' },
  { label: 'On time', value: 'ON_TIME' },
  { label: 'Early', value: 'EARLY' },
  { label: 'Late', value: 'LATE' },
];

export function punctualitySelectValue(
  status?: string | null,
  auto?: boolean | null,
): TimesheetPunctualitySelection {
  if (auto !== false) {
    return 'AUTO';
  }

  return (status || 'ON_TIME') as TimesheetPunctualityStatus;
}

export function punctualityColor(status?: string | null): string {
  const normalized = (status || '').toUpperCase();

  if (normalized === 'EARLY') {
    return 'info';
  }

  if (normalized === 'LATE') {
    return 'negative';
  }

  if (normalized === 'ON_TIME') {
    return 'positive';
  }

  return 'grey-6';
}

export function punctualityLabel(
  side: 'clockIn' | 'clockOut',
  status?: string | null,
  auto?: boolean | null,
): string {
  const normalized = (status || '').toUpperCase();

  if (!normalized) {
    return '—';
  }

  let label = 'On time';

  if (normalized === 'EARLY') {
    label = side === 'clockIn' ? 'In early' : 'Out early';
  } else if (normalized === 'LATE') {
    label = side === 'clockIn' ? 'In late' : 'Out late';
  } else if (normalized === 'ON_TIME') {
    label = side === 'clockIn' ? 'In on time' : 'Out on time';
  }

  if (auto !== false) {
    return `${label} (auto)`;
  }

  return label;
}

export function punctualityTooltip(
  side: 'clockIn' | 'clockOut',
  row: {
    scheduledStartTime?: string | null;
    scheduledEndTime?: string | null;
    clockInPunctuality?: string | null;
    clockOutPunctuality?: string | null;
    clockInPunctualityAuto?: boolean | null;
    clockOutPunctualityAuto?: boolean | null;
  },
): string | null {
  const scheduled = side === 'clockIn' ? row.scheduledStartTime : row.scheduledEndTime;
  const status = side === 'clockIn' ? row.clockInPunctuality : row.clockOutPunctuality;
  const auto = side === 'clockIn' ? row.clockInPunctualityAuto : row.clockOutPunctualityAuto;

  if (!scheduled && !status) {
    return null;
  }

  const lines: string[] = [];

  if (scheduled) {
    lines.push(`Scheduled ${side === 'clockIn' ? 'start' : 'end'}: ${scheduled}`);
  }

  if (status) {
    lines.push(`Status: ${punctualityLabel(side, status, auto)}`);
  } else if (auto !== false) {
    lines.push('Status: Auto (no schedule or punch time)');
  }

  return lines.join('\n');
}
