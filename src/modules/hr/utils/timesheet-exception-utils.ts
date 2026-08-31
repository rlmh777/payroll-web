import type { TimesheetRow } from '@payroll/stores/attendance-store';

export interface TimesheetException {
  code: string;
  severity: 'warning' | 'error';
  message: string;
}

export function timesheetExceptions(row: Pick<TimesheetRow, 'exceptions' | 'remarks'>): TimesheetException[] {
  if (Array.isArray(row.exceptions) && row.exceptions.length > 0) {
    return row.exceptions.map((exception) => ({
      code: String(exception.code ?? 'issue'),
      severity: exception.severity ?? 'warning',
      message: String(exception.message ?? ''),
    }));
  }

  const remarks = row.remarks?.trim();
  if (!remarks) {
    return [];
  }

  return [{
    code: 'processing_issue',
    severity: 'error',
    message: remarks,
  }];
}

export function timesheetExceptionSummary(row: Pick<TimesheetRow, 'exceptions' | 'remarks'>): string {
  return timesheetExceptions(row)
    .map((exception) => exception.message)
    .filter(Boolean)
    .join('\n');
}

export function timesheetHasBlockingExceptions(row: Pick<TimesheetRow, 'exceptions' | 'remarks' | 'hasBlockingIssues'>): boolean {
  if (row.hasBlockingIssues) {
    return true;
  }

  return timesheetExceptions(row).some((exception) => exception.severity === 'error');
}

export function exceptionSeverityColor(severity: string) {
  return severity === 'error' ? 'negative' : 'warning';
}

export function isPendingApprovalStatus(status?: string | null) {
  const normalized = String(status ?? '').toUpperCase();
  return normalized === 'PENDING' || normalized === 'PENDING_SUPERVISOR';
}
