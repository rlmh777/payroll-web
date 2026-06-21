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

  if (value.toUpperCase() === 'HOURLY') return 'Hourly rate';
  if (value.toUpperCase() === 'BASE_SALARY') return 'Base salary';

  return humanizeStatus(value);
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
