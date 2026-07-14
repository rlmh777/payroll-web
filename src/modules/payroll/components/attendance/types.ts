export type TimesheetApprovalAction = 'APPROVED' | 'REJECTED';

export interface ClockingFilterForm {
  startDate: string;
  endDate: string;
  biometricUserId: string;
  deviceId: string;
}

export interface TimesheetFilterForm {
  payPeriodScheduleId: string | null;
  startDate: string;
  endDate: string;
  approvalStatus: string | null;
  workingStatus: string | null;
  payType: string | null;
  issuesOnly: boolean;
}
