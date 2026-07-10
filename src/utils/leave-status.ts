export type LeaveStatusCode =
  | 'CANCELLED'
  | 'PENDING_SUPERVISOR_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'SCHEDULED'
  | 'TAKEN'
  | 'REJECTED';

export type LeaveStatusAction = 'approve' | 'reject' | 'cancel' | 'submit_for_approval';

export interface LeaveStatusRecord {
  id: number;
  code: LeaveStatusCode;
  name: string;
  sortOrder: number;
  isTerminal: boolean;
  requiresSupervisor: boolean;
}

const STATUS_LABELS: Record<LeaveStatusCode, string> = {
  CANCELLED: 'Cancelled',
  PENDING_SUPERVISOR_APPROVAL: 'Pending supervisor approval',
  PENDING_APPROVAL: 'Pending approval',
  SCHEDULED: 'Scheduled',
  TAKEN: 'Taken',
  REJECTED: 'Rejected',
};

const STATUS_COLORS: Record<LeaveStatusCode, string> = {
  CANCELLED: 'grey',
  PENDING_SUPERVISOR_APPROVAL: 'orange',
  PENDING_APPROVAL: 'amber',
  SCHEDULED: 'primary',
  TAKEN: 'positive',
  REJECTED: 'negative',
};

export function normalizeLeaveStatusCode(value?: string | null): LeaveStatusCode | null {
  const normalized = value?.toUpperCase() ?? '';
  if (normalized === 'PENDING') return 'PENDING_SUPERVISOR_APPROVAL';
  if (normalized === 'APPROVED') return 'SCHEDULED';
  if (Object.prototype.hasOwnProperty.call(STATUS_LABELS, normalized)) {
    return normalized as LeaveStatusCode;
  }
  return null;
}

export function formatLeaveStatus(value?: string | null, fallbackName?: string | null): string {
  const code = normalizeLeaveStatusCode(value);
  if (code) return STATUS_LABELS[code];
  return fallbackName ?? value ?? '—';
}

export function leaveStatusColor(value?: string | null): string {
  const code = normalizeLeaveStatusCode(value);
  return code ? STATUS_COLORS[code] : 'grey';
}

export function leaveAllowsSupervisorApproval(value?: string | null): boolean {
  const code = normalizeLeaveStatusCode(value);
  return code === 'PENDING_SUPERVISOR_APPROVAL' || code === 'PENDING_APPROVAL';
}

export function leaveAllowsCancellation(value?: string | null): boolean {
  const code = normalizeLeaveStatusCode(value);
  return code === 'PENDING_SUPERVISOR_APPROVAL'
    || code === 'PENDING_APPROVAL'
    || code === 'SCHEDULED';
}
