import { compensationAllowsOvertime } from '@payroll/utils/compensation-pay-utils';

export function formatDateTime(value?: string | null) {
  if (!value) return '-';

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      });
}

export function formatDate(value?: string | null) {
  if (!value) return '-';

  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
}

export function humanizeStatus(value?: string | null) {
  if (!value) return '-';

  return value
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function formatPayType(value?: string | null) {
  if (!value) return '-';

  const normalized = value.toUpperCase();
  if (normalized === 'HOURLY_NO_OT' || normalized === 'HOURLY') return 'Hourly (no OT)';
  if (normalized === 'HOURLY_OT') return 'Hourly (OT)';
  if (normalized === 'BASE_NO_OT' || normalized === 'SALARY_NO_CLOCK' || normalized === 'BASE_SALARY' || normalized === 'WEEKLY_SALARY') {
    return 'Base rate (no OT)';
  }
  if (normalized === 'BASE_OT' || normalized === 'WEEKLY_SALARY_OT') return 'Base rate (OT)';

  return humanizeStatus(value);
}

export function formatHours(value?: number | null) {
  if (value == null || Number.isNaN(Number(value))) {
    return '0.00';
  }

  return Number(value).toFixed(2);
}

export function formatOvertimeForPayType(payType?: string | null, hours?: number | null) {
  if (!compensationAllowsOvertime(payType)) {
    return '—';
  }

  return formatHours(hours);
}

export function approvalIcon(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'APPROVED') return 'check_circle';
  if (normalized === 'REJECTED') return 'cancel';
  if (normalized === 'REVIEW_REQUIRED') return 'warning_amber';
  if (normalized === 'PARTIALLY_APPROVED') return 'rule';

  return 'pending';
}

export function statusColor(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'APPROVED') return 'positive';
  if (normalized === 'REJECTED') return 'negative';
  if (normalized === 'REVIEW_REQUIRED') return 'deep-orange';
  if (normalized === 'PARTIALLY_APPROVED') return 'primary';

  return 'warning';
}

export function workingStatusColor(status: string) {
  const normalized = status.toUpperCase();

  if (normalized === 'OVERTIME') return 'deep-orange';
  if (normalized === 'UNPAID') return 'negative';
  if (normalized === 'HOLIDAY') return 'teal';

  return 'positive';
}
