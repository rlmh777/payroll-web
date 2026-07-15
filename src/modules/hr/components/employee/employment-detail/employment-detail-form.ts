export interface EmploymentDetailFormModel {
  startDate: string;
  endDate: string | null;
  isActive: boolean;
  jobTitleId: number | null;
  requiresClocking: boolean;
  benefits: string;
  accountId: string;
  contractTypeId: number;
  employmentPolicies: string;
  contractAgreementFile: File | null;
  contractAgreementPath: string | null;
  departmentId: number;
  worksiteId: number;
  defaultPayPeriodGroupId: string | null;
}

export function createDefaultEmploymentDetailForm(): EmploymentDetailFormModel {
  return {
    startDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: true,
    jobTitleId: null,
    requiresClocking: true,
    benefits: '',
    accountId: null as unknown as string,
    contractTypeId: null as unknown as number,
    employmentPolicies: '',
    contractAgreementFile: null,
    contractAgreementPath: null,
    departmentId: null as unknown as number,
    worksiteId: null as unknown as number,
    defaultPayPeriodGroupId: null,
  };
}

export function contractAgreementFileName(path: string | null | undefined): string | null {
  if (!path) return null;
  const segments = path.split('/');
  return segments[segments.length - 1] ?? path;
}

export function validateEmploymentDetailForm(form: EmploymentDetailFormModel): string | null {
  if (!form.startDate) return 'Start date is required.';
  if (form.endDate && form.startDate && form.endDate < form.startDate) {
    return 'End date must be on or after start date.';
  }
  if (!form.departmentId) return 'Department is required.';
  if (!form.worksiteId) return 'Worksite is required.';
  if (!form.contractTypeId) return 'Contract type is required.';
  if (!form.defaultPayPeriodGroupId) return 'Pay period group is required.';
  if (!form.accountId) return 'Account is required.';
  return null;
}

interface EmploymentDetailRecordSource {
  startDate?: string;
  endDate?: string | null;
  isActive: boolean;
  jobTitleId?: number | null;
  requiresClocking?: boolean | null;
  benefits?: string | null;
  accountId?: string | null;
  contractTypeId?: number | null;
  employmentPolicies?: string | null;
  contractAgreementPath?: string | null;
  departmentId?: number | null;
  worksiteId?: number | null;
  defaultPayPeriodGroupId?: string | null;
  chartOfAccount?: { id: string } | null;
  chart_of_account?: { id: string } | null;
  contractType?: { id: number } | null;
  contract_type?: { id: number } | null;
  jobTitle?: { id: number } | null;
  job_title?: { id: number } | null;
  department?: { id: number } | null;
  worksite?: { id: number } | null;
  defaultPayPeriodGroup?: { id: string } | null;
  default_pay_period_group?: { id: string } | null;
}

export function mapEmploymentDetailRecordToForm(
  record: EmploymentDetailRecordSource,
): EmploymentDetailFormModel {
  return {
    startDate: record.startDate?.slice(0, 10) ?? '',
    endDate: record.endDate?.slice(0, 10) ?? null,
    isActive: record.isActive,
    jobTitleId: record.jobTitleId ?? record.jobTitle?.id ?? record.job_title?.id ?? null,
    requiresClocking: record.requiresClocking !== false,
    benefits: record.benefits ?? '',
    accountId: record.accountId ?? record.chartOfAccount?.id ?? record.chart_of_account?.id ?? null as unknown as string,
    contractTypeId: record.contractTypeId ?? record.contractType?.id ?? record.contract_type?.id ?? null as unknown as number,
    employmentPolicies: record.employmentPolicies ?? '',
    contractAgreementFile: null,
    contractAgreementPath: record.contractAgreementPath ?? null,
    departmentId: record.departmentId ?? record.department?.id ?? null as unknown as number,
    worksiteId: record.worksiteId ?? record.worksite?.id ?? null as unknown as number,
    defaultPayPeriodGroupId: record.defaultPayPeriodGroupId ?? record.defaultPayPeriodGroup?.id ?? record.default_pay_period_group?.id ?? null,
  };
}
