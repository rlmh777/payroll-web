export type LeaveStatusCode =
  | 'CANCELLED'
  | 'PENDING_SUPERVISOR_APPROVAL'
  | 'PENDING_APPROVAL'
  | 'PENDING_HR_APPROVAL'
  | 'PENDING_ACCOUNTS_CONFIRMATION'
  | 'SCHEDULED'
  | 'TAKEN'
  | 'REJECTED';

export type LeaveStatusAction = 'approve' | 'reject' | 'cancel' | 'submit_for_approval';

export type LeavePaymentTreatment = 'unpaid' | 'paid_with_payroll' | 'already_paid';

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
  PENDING_HR_APPROVAL: 'Pending HR approval',
  PENDING_ACCOUNTS_CONFIRMATION: 'Pending accounts confirmation',
  SCHEDULED: 'Scheduled',
  TAKEN: 'Taken',
  REJECTED: 'Rejected',
};

const STATUS_COLORS: Record<LeaveStatusCode, string> = {
  CANCELLED: 'grey',
  PENDING_SUPERVISOR_APPROVAL: 'orange',
  PENDING_APPROVAL: 'amber',
  PENDING_HR_APPROVAL: 'deep-orange',
  PENDING_ACCOUNTS_CONFIRMATION: 'indigo',
  SCHEDULED: 'primary',
  TAKEN: 'positive',
  REJECTED: 'negative',
};

export const DEFAULT_VACATION_PAYMENT_TREATMENT: LeavePaymentTreatment = 'paid_with_payroll';

export const LEAVE_PAYMENT_TREATMENT_OPTIONS: Array<{ label: string; value: LeavePaymentTreatment }> = [
  { label: 'Include in next payroll (default)', value: 'paid_with_payroll' },
  { label: 'Already paid as an advance — record on next payroll, do not pay again', value: 'already_paid' },
  { label: 'Unpaid (do not pay)', value: 'unpaid' },
];

export const VACATION_PAYMENT_DIALOG_MESSAGE =
  'Vacation pay is not extra money — it is salary for those days, or an advance if it was already paid.\n\n'
  + '• Include in next payroll (default) — those days are paid with that payroll\n'
  + '• Already paid as an advance — next payroll records the advance and does not pay those days again\n'
  + '• Unpaid — no salary for these days';

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

export function leaveAllowsApprovalAction(value?: string | null): boolean {
  const code = normalizeLeaveStatusCode(value);
  return code === 'PENDING_SUPERVISOR_APPROVAL'
    || code === 'PENDING_APPROVAL'
    || code === 'PENDING_HR_APPROVAL'
    || code === 'PENDING_ACCOUNTS_CONFIRMATION';
}

/** @deprecated Use leaveAllowsApprovalAction */
export function leaveAllowsSupervisorApproval(value?: string | null): boolean {
  return leaveAllowsApprovalAction(value);
}

export function isVacationLeaveType(code?: string | null, name?: string | null): boolean {
  if ((code ?? '').toUpperCase() === 'VACATION') {
    return true;
  }
  return (name ?? '').toLowerCase().includes('vacation');
}

export function leaveRequiresPaymentConfirmation(
  status?: string | null,
  leaveTypeCode?: string | null,
  leaveTypeName?: string | null,
): boolean {
  return normalizeLeaveStatusCode(status) === 'PENDING_ACCOUNTS_CONFIRMATION'
    && isVacationLeaveType(leaveTypeCode, leaveTypeName);
}

export function leaveAllowsCancellation(value?: string | null): boolean {
  const code = normalizeLeaveStatusCode(value);
  return code === 'PENDING_SUPERVISOR_APPROVAL'
    || code === 'PENDING_APPROVAL'
    || code === 'PENDING_HR_APPROVAL'
    || code === 'PENDING_ACCOUNTS_CONFIRMATION'
    || code === 'SCHEDULED';
}

export function formatLeavePaymentTreatment(value?: string | null): string {
  switch (value) {
    case 'unpaid':
      return 'Unpaid';
    case 'paid_with_payroll':
      return 'Include in next payroll';
    case 'already_paid':
      return 'Already paid (advance)';
    default:
      return '—';
  }
}
