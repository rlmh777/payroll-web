export type LeaveAccrualMethod = 'UPFRONT' | 'MONTHLY' | 'NONE';

export const LEAVE_ACCRUAL_OPTIONS: Array<{ label: string; value: LeaveAccrualMethod; description: string }> = [
  { label: 'Upfront (full year)', value: 'UPFRONT', description: 'Full annual entitlement available at the start of the contract year.' },
  { label: 'Monthly accrual', value: 'MONTHLY', description: 'Entitlement accrues each month from the contract start date.' },
  { label: 'No balance tracking', value: 'NONE', description: 'Leave type does not use a day balance.' },
];

export interface LeaveTypePolicy {
  id?: number;
  leaveTypeId?: number;
  annualEntitlementDays: number;
  accrualMethod: LeaveAccrualMethod;
  isEnabled: boolean;
}

export interface LeaveTypeRecord {
  id: number;
  name: string;
  code: string;
  isPaid: boolean;
  affectsBalance: boolean;
  requiresCertification: boolean;
  isActive: boolean;
  sortOrder: number;
  policy?: LeaveTypePolicy | null;
}

export interface LeaveTypeFormModel {
  name: string;
  code: string;
  isPaid: boolean;
  affectsBalance: boolean;
  requiresCertification: boolean;
  isActive: boolean;
  sortOrder: number;
  annualEntitlementDays: number;
  accrualMethod: LeaveAccrualMethod;
  policyEnabled: boolean;
}

export interface LeaveBalanceRow {
  leaveTypeId: number;
  code: string | null;
  name: string;
  isPaid: boolean;
  affectsBalance: boolean;
  requiresCertification: boolean;
  annualEntitlementDays: number;
  accrualMethod: LeaveAccrualMethod;
  accruedDays: number;
  takenDays: number;
  scheduledDays: number;
  availableDays: number;
  policySource: string;
  periodStart: string;
  periodEnd: string;
}

export interface ContractLeaveEntitlementRow {
  leaveTypeId: number;
  code: string | null;
  name: string;
  isPaid: boolean;
  affectsBalance: boolean;
  orgAnnualEntitlementDays: number;
  orgAccrualMethod: LeaveAccrualMethod;
  annualEntitlementDays: number | null;
  accrualMethod: LeaveAccrualMethod | null;
  resolvedAnnualEntitlementDays: number;
  resolvedAccrualMethod: LeaveAccrualMethod;
  usesContractOverride: boolean;
  useOrgDefault: boolean;
}

export function createDefaultLeaveTypeForm(): LeaveTypeFormModel {
  return {
    name: '',
    code: '',
    isPaid: true,
    affectsBalance: true,
    requiresCertification: false,
    isActive: true,
    sortOrder: 0,
    annualEntitlementDays: 0,
    accrualMethod: 'UPFRONT',
    policyEnabled: true,
  };
}

export function mapLeaveTypeToForm(record: LeaveTypeRecord): LeaveTypeFormModel {
  return {
    name: record.name,
    code: record.code,
    isPaid: record.isPaid,
    affectsBalance: record.affectsBalance,
    requiresCertification: record.requiresCertification,
    isActive: record.isActive,
    sortOrder: record.sortOrder,
    annualEntitlementDays: Number(record.policy?.annualEntitlementDays ?? 0),
    accrualMethod: record.policy?.accrualMethod ?? 'UPFRONT',
    policyEnabled: record.policy?.isEnabled ?? true,
  };
}

export function formatAccrualMethod(value?: string | null): string {
  const option = LEAVE_ACCRUAL_OPTIONS.find((entry) => entry.value === value);
  return option?.label ?? value ?? '—';
}

export function formatLeaveDays(value: number): string {
  return Number(value).toFixed(2);
}
