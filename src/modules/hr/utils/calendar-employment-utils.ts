import type { CalendarEmployee } from '@hr/stores/calendar-store';
import {
  defaultRequiresClocking,
  normalizeCompensationMethod,
} from '@payroll/components/employee/compensation/compensation-form';

export interface EmploymentDetailSummary {
  id: string | null;
  departmentId: number | null;
  worksiteId: number | null;
  label: string;
}

type EmploymentDetailLike = {
  id?: string;
  isActive?: boolean;
  is_active?: boolean;
  startDate?: string;
  start_date?: string;
  endDate?: string | null;
  end_date?: string | null;
  jobTitle?: string | null;
  job_title?: string | null;
  contractType?: { name?: string | null } | null;
  contract_type?: { name?: string | null } | null;
  defaultPayPeriodGroup?: { name?: string | null } | null;
  default_pay_period_group?: { name?: string | null } | null;
  departmentId?: number | null;
  department?: { id: number | string; name?: string | null } | null;
  worksiteId?: number | null;
  worksite?: { id: number } | null;
};

type CompensationLike = {
  id?: string;
  employmentDetailId?: string | null;
  employment_detail_id?: string | null;
  isActive?: boolean;
  is_active?: boolean;
  effectiveDate?: string;
  effective_date?: string;
  endDate?: string | null;
  end_date?: string | null;
  compensationMethod?: string | null;
  compensation_method?: string | null;
  requiresClocking?: boolean | null;
  requires_clocking?: boolean | null;
  hourlyRate?: string | number | null;
  hourly_rate?: string | number | null;
  yearlyRate?: string | number | null;
  yearly_rate?: string | number | null;
  standardWeeklyHours?: string | number | null;
  standard_weekly_hours?: string | number | null;
};

export interface EmploymentCompensation {
  compensationMethod: string;
  hourlyRate: number;
  yearlyRate: number;
  standardWeeklyHours: number;
  requiresClocking: boolean;
}

export interface EmploymentContractOption {
  id: string;
  label: string;
  departmentId: number | null;
  worksiteId: number | null;
}

type RawCalendarEmployee = CalendarEmployee & {
  employment_details?: EmploymentDetailLike[];
  employee_compensations?: CompensationLike[];
};

function employmentDetailsFor(employee: RawCalendarEmployee | null | undefined): EmploymentDetailLike[] {
  if (!employee) {
    return [];
  }

  if (Array.isArray(employee.employmentDetails) && employee.employmentDetails.length) {
    return employee.employmentDetails;
  }

  if (Array.isArray(employee.employment_details) && employee.employment_details.length) {
    return employee.employment_details;
  }

  return employee.employmentDetails ?? employee.employment_details ?? [];
}

function compensationsFor(employee: RawCalendarEmployee | null | undefined): CompensationLike[] {
  if (!employee) {
    return [];
  }

  if (Array.isArray(employee.employeeCompensations) && employee.employeeCompensations.length) {
    return employee.employeeCompensations;
  }

  if (Array.isArray(employee.employee_compensations) && employee.employee_compensations.length) {
    return employee.employee_compensations;
  }

  return employee.employeeCompensations ?? employee.employee_compensations ?? [];
}

function normalizeEmploymentDetail(detail: EmploymentDetailLike): EmploymentDetailLike {
  const normalized: EmploymentDetailLike = { ...detail };
  const startDate = detail.startDate ?? detail.start_date;
  const endDate = detail.endDate ?? detail.end_date;
  const jobTitle = detail.jobTitle ?? detail.job_title;
  const contractType = detail.contractType ?? detail.contract_type;
  const defaultPayPeriodGroup = detail.defaultPayPeriodGroup ?? detail.default_pay_period_group;

  if (startDate !== undefined) {
    normalized.startDate = startDate;
  }

  if (endDate !== undefined) {
    normalized.endDate = endDate;
  }

  if (jobTitle !== undefined) {
    normalized.jobTitle = jobTitle;
  }

  if (contractType !== undefined) {
    normalized.contractType = contractType;
  }

  if (defaultPayPeriodGroup !== undefined) {
    normalized.defaultPayPeriodGroup = defaultPayPeriodGroup;
  }

  return normalized;
}

function normalizeCompensation(record: CompensationLike): CompensationLike {
  const normalized: CompensationLike = { ...record };
  const employmentDetailId = record.employmentDetailId ?? record.employment_detail_id;
  const effectiveDate = record.effectiveDate ?? record.effective_date;
  const endDate = record.endDate ?? record.end_date;
  const compensationMethod = record.compensationMethod ?? record.compensation_method;
  const requiresClocking = record.requiresClocking ?? record.requires_clocking;
  const hourlyRate = record.hourlyRate ?? record.hourly_rate;
  const yearlyRate = record.yearlyRate ?? record.yearly_rate;

  if (employmentDetailId !== undefined) {
    normalized.employmentDetailId = employmentDetailId;
  }

  if (effectiveDate !== undefined) {
    normalized.effectiveDate = effectiveDate;
  }

  if (endDate !== undefined) {
    normalized.endDate = endDate;
  }

  if (compensationMethod !== undefined) {
    normalized.compensationMethod = compensationMethod;
  }

  if (requiresClocking !== undefined) {
    normalized.requiresClocking = requiresClocking;
  }

  if (hourlyRate !== undefined) {
    normalized.hourlyRate = hourlyRate;
  }

  if (yearlyRate !== undefined) {
    normalized.yearlyRate = yearlyRate;
  }

  return normalized;
}

export function normalizeCalendarEmployee(raw: RawCalendarEmployee): CalendarEmployee {
  const details = employmentDetailsFor(raw).map(normalizeEmploymentDetail) as CalendarEmployee['employmentDetails'];
  const compensations = compensationsFor(raw).map(normalizeCompensation) as CalendarEmployee['employeeCompensations'];
  const employee: CalendarEmployee = {
    id: raw.id,
    firstName: raw.firstName,
    lastName: raw.lastName,
  };

  if (raw.code) {
    employee.code = raw.code;
  }

  if (details?.length) {
    employee.employmentDetails = details;
  }

  if (compensations?.length) {
    employee.employeeCompensations = compensations;
  }

  return employee;
}

export function normalizeCalendarEmployees(
  raw: Array<RawCalendarEmployee | Record<string, unknown>>,
): CalendarEmployee[] {
  return raw.map((item) => normalizeCalendarEmployee(item as RawCalendarEmployee));
}

export function employmentContractLabel(detail: EmploymentDetailLike): string {
  const title = detail.jobTitle
    ?? detail.job_title
    ?? detail.contractType?.name
    ?? detail.contract_type?.name
    ?? 'Contract';
  const department = detail.department?.name ?? 'No department';
  const payPeriodGroup = detail.defaultPayPeriodGroup?.name
    ?? detail.default_pay_period_group?.name
    ?? 'No pay period group';

  return `${title} - ${department} - ${payPeriodGroup}`;
}

export function getEmploymentContractOptions(
  employee:
    | CalendarEmployee
    | RawCalendarEmployee
    | null
    | undefined,
  referenceDate?: string,
  departmentId?: number | null,
): EmploymentContractOption[] {
  const details = employmentDetailsFor(employee ?? undefined);
  const date = referenceDate ?? new Date().toISOString().slice(0, 10);

  return details
    .filter((detail) => {
      const start = detail.startDate ?? detail.start_date ?? '';
      const end = detail.endDate ?? detail.end_date ?? null;
      const active = (detail.isActive ?? detail.is_active) !== false;
      const detailDepartmentId = detail.departmentId != null
        ? Number(detail.departmentId)
        : detail.department?.id != null
          ? Number(detail.department.id)
          : null;

      return active
        && (!start || start <= date)
        && (!end || end >= date)
        && (departmentId == null || detailDepartmentId === departmentId);
    })
    .map((detail) => ({
      id: detail.id ?? '',
      label: employmentContractLabel(detail),
      departmentId: detail.departmentId != null
        ? Number(detail.departmentId)
        : detail.department?.id != null
          ? Number(detail.department.id)
          : null,
      worksiteId: detail.worksiteId != null
        ? Number(detail.worksiteId)
        : detail.worksite?.id != null
          ? Number(detail.worksite.id)
          : null,
    }))
    .filter((option) => option.id);
}

export function getActiveEmploymentDetail(
  employee:
    | CalendarEmployee
    | RawCalendarEmployee
    | null
    | undefined,
): EmploymentDetailSummary | null {
  const details = employmentDetailsFor(employee ?? undefined);
  if (!details.length) {
    return null;
  }

  const active = details.filter((detail) => detail.isActive !== false);
  const candidates = active.length ? active : details;
  const sorted = [...candidates].sort((left, right) =>
    (right.startDate ?? right.start_date ?? '').localeCompare(left.startDate ?? left.start_date ?? ''),
  );
  const detail = sorted[0];
  if (!detail) {
    return null;
  }

  const departmentId =
    detail.departmentId != null
      ? Number(detail.departmentId)
      : detail.department?.id != null
        ? Number(detail.department.id)
        : null;

  const worksiteId =
    detail.worksiteId != null
      ? Number(detail.worksiteId)
      : detail.worksite?.id != null
        ? Number(detail.worksite.id)
        : null;

  return { id: detail.id ?? null, departmentId, worksiteId, label: employmentContractLabel(detail) };
}

function parseRate(value: string | number | null | undefined): number {
  if (value == null || value === '') {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getActiveEmploymentCompensation(
  employee:
    | CalendarEmployee
    | RawCalendarEmployee
    | null
    | undefined,
  referenceDate?: string,
): EmploymentCompensation | null {
  const records = compensationsFor(employee ?? undefined);
  if (!records.length) {
    return null;
  }

  const date = referenceDate ?? new Date().toISOString().slice(0, 10);
  const matching = records.filter((record) => {
    const start = record.effectiveDate ?? record.effective_date ?? '';
    const end = record.endDate ?? record.end_date ?? null;
    return start <= date && (!end || end >= date);
  });

  const active = matching.length
    ? matching
    : records.filter((record) => (record.isActive ?? record.is_active) !== false);
  const candidates = active.length ? active : records;
  const sorted = [...candidates].sort((left, right) => {
    const leftActive = (left.isActive ?? left.is_active) !== false;
    const rightActive = (right.isActive ?? right.is_active) !== false;
    if (leftActive !== rightActive) {
      return Number(rightActive) - Number(leftActive);
    }

    return (right.effectiveDate ?? right.effective_date ?? '').localeCompare(
      left.effectiveDate ?? left.effective_date ?? '',
    );
  });

  const record = sorted[0];
  if (!record) {
    return null;
  }

  const hourlyRate = parseRate(record.hourlyRate ?? record.hourly_rate);
  const yearlyRate = parseRate(record.yearlyRate ?? record.yearly_rate);
  const standardWeeklyHours = parseRate(record.standardWeeklyHours ?? record.standard_weekly_hours) || 40;
  const rawMethod = String(record.compensationMethod ?? record.compensation_method ?? '').trim().toUpperCase();
  const compensationMethod = rawMethod === 'BASE_SALARY' ? 'BASE_NO_OT'
    : rawMethod === 'SALARY_NO_CLOCK' ? 'BASE_NO_OT'
    : rawMethod === 'HOURLY' ? 'HOURLY_OT'
    : rawMethod === 'WEEKLY_SALARY' ? 'BASE_NO_OT'
    : rawMethod === 'WEEKLY_SALARY_OT' ? 'BASE_OT'
    : rawMethod;

  if (hourlyRate <= 0 && yearlyRate <= 0) {
    return null;
  }

  const resolvedMethod = compensationMethod || (yearlyRate > 0 ? 'BASE_NO_OT' : 'HOURLY_OT');
  const explicitClocking = record.requiresClocking ?? record.requires_clocking;

  return {
    compensationMethod: resolvedMethod,
    hourlyRate,
    yearlyRate,
    standardWeeklyHours,
    requiresClocking: explicitClocking ?? defaultRequiresClocking(normalizeCompensationMethod(resolvedMethod)),
  };
}
