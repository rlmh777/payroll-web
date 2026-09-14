import type { CalendarEntry } from '@hr/stores/calendar-store';
import { enumerateDateRange, normalizeDateRange } from '@hr/utils/calendar-event-utils';

export interface SchedulerLeaveConflict {
  leaveId: string;
  leaveTypeName: string;
  startDate: string;
  endDate: string;
  days: string[];
}

function toDateOnly(value: string | null | undefined, fallback = ''): string {
  if (!value) {
    return fallback;
  }

  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? fallback;
}

function leaveId(event: CalendarEntry): string | null {
  if (event.leave_id) {
    return event.leave_id;
  }

  const match = event.id.match(/^leave-([0-9a-f-]{36})-/i);
  return match?.[1] ?? null;
}

/** Active leave events that overlap an employee + date range (and optional times). */
export function findSchedulerLeaveConflicts(
  leaveEvents: CalendarEntry[],
  employeeId: string | null | undefined,
  startDate: string,
  endDate: string,
  startTime?: string | null,
  endTime?: string | null,
): SchedulerLeaveConflict[] {
  if (!employeeId || !startDate || !endDate) {
    return [];
  }

  const range = normalizeDateRange(startDate, endDate);
  const days = new Set(enumerateDateRange(range.start, range.end));
  const byLeave = new Map<string, SchedulerLeaveConflict>();

  for (const event of leaveEvents) {
    if (event.source !== 'leave' || event.employee_id !== employeeId) {
      continue;
    }

    const eventDay = toDateOnly(event.date, event.date);
    if (!days.has(eventDay)) {
      continue;
    }

    const leaveStart = event.start_time?.slice(0, 5) || null;
    const leaveEnd = event.end_time?.slice(0, 5) || null;
    const shiftStart = startTime?.slice(0, 5) || null;
    const shiftEnd = endTime?.slice(0, 5) || null;

    if (leaveStart && leaveEnd && shiftStart && shiftEnd) {
      if (!(shiftStart < leaveEnd && leaveStart < shiftEnd)) {
        continue;
      }
    }

    const id = leaveId(event) ?? event.id;
    const existing = byLeave.get(id);
    if (existing) {
      if (!existing.days.includes(eventDay)) {
        existing.days.push(eventDay);
      }
      continue;
    }

    byLeave.set(id, {
      leaveId: id,
      leaveTypeName: event.leave_type_name?.trim() || event.description?.trim() || 'Leave',
      startDate: toDateOnly(event.start_date, eventDay),
      endDate: toDateOnly(event.end_date, eventDay),
      days: [eventDay],
    });
  }

  return [...byLeave.values()];
}

export function formatSchedulerLeaveConflictMessage(conflicts: SchedulerLeaveConflict[]): string {
  if (!conflicts.length) {
    return '';
  }

  const labels = conflicts.map((conflict) => {
    const range = conflict.startDate === conflict.endDate
      ? conflict.startDate
      : `${conflict.startDate} to ${conflict.endDate}`;
    return `${conflict.leaveTypeName} (${range})`;
  });

  return `This employee already has leave recorded: ${labels.join('; ')}.`;
}
