export type CompensationMethod =
  | 'HOURLY_NO_OT'
  | 'HOURLY_OT'
  | 'BASE_NO_OT'
  | 'BASE_OT';

export type CompensationReasonType =
  | 'INITIAL'
  | 'INCREMENT'
  | 'PROMOTION'
  | 'EVALUATION'
  | 'CORRECTION'
  | 'OTHER';

export const SALARY_HOURS_PER_YEAR = 2080;
export const DEFAULT_STANDARD_WEEKLY_HOURS = 40;
export const MONTHLY_PAY_PERIODS_PER_YEAR = 12;
export const BIWEEKLY_PAY_PERIODS_PER_YEAR = 26;

export const COMPENSATION_METHOD_OPTIONS: Array<{
  label: string;
  value: CompensationMethod;
  description: string;
}> = [
  {
    label: 'Hourly (no overtime)',
    value: 'HOURLY_NO_OT',
    description: 'Hourly rate and standard weekly hours define weekly and annual base pay. Period pay is fixed — extra clocked hours do not increase pay.',
  },
  {
    label: 'Hourly (with overtime)',
    value: 'HOURLY_OT',
    description: 'Hourly rate and standard weekly hours define the base contract. Pay is calculated from clocked hours, with overtime per department rules.',
  },
  {
    label: 'Base rate (no overtime)',
    value: 'BASE_NO_OT',
    description: 'Annual base and standard weekly hours define the contract. Period pay is fixed regardless of clock variance.',
  },
  {
    label: 'Base rate (with overtime)',
    value: 'BASE_OT',
    description: 'Annual base for scheduled hours, plus overtime for extra clocked time beyond the schedule.',
  },
];

export const COMPENSATION_REASON_OPTIONS: Array<{ label: string; value: CompensationReasonType }> = [
  { label: 'Initial', value: 'INITIAL' },
  { label: 'Salary increment', value: 'INCREMENT' },
  { label: 'Promotion', value: 'PROMOTION' },
  { label: 'Evaluation', value: 'EVALUATION' },
  { label: 'Correction', value: 'CORRECTION' },
  { label: 'Other', value: 'OTHER' },
];

export interface EmployeeCompensationFormModel {
  employmentDetailId: string;
  effectiveDate: string;
  endDate: string | null;
  isActive: boolean;
  payscale: string;
  payscalePoint: string;
  compensationMethod: CompensationMethod;
  requiresClocking: boolean;
  hourlyRate: number;
  yearlyRate: number;
  standardWeeklyHours: number;
  reasonType: CompensationReasonType;
  reasonNote: string;
}

export function createDefaultEmployeeCompensationForm(): EmployeeCompensationFormModel {
  return {
    employmentDetailId: '',
    effectiveDate: new Date().toISOString().slice(0, 10),
    endDate: null,
    isActive: true,
    payscale: '',
    payscalePoint: '',
    compensationMethod: 'HOURLY_OT',
    requiresClocking: true,
    hourlyRate: 0,
    yearlyRate: 0,
    standardWeeklyHours: DEFAULT_STANDARD_WEEKLY_HOURS,
    reasonType: 'INCREMENT',
    reasonNote: '',
  };
}

export function normalizeCompensationMethod(value?: string | null): CompensationMethod {
  const normalized = value?.toUpperCase() ?? 'HOURLY_OT';

  if (normalized === 'HOURLY_NO_OT') return 'HOURLY_NO_OT';
  if (normalized === 'HOURLY_OT' || normalized === 'HOURLY') return 'HOURLY_OT';
  if (normalized === 'BASE_NO_OT' || normalized === 'SALARY_NO_CLOCK' || normalized === 'BASE_SALARY' || normalized === 'WEEKLY_SALARY') {
    return 'BASE_NO_OT';
  }
  if (normalized === 'BASE_OT' || normalized === 'WEEKLY_SALARY_OT') return 'BASE_OT';

  return 'HOURLY_OT';
}

export function isHourlyMethod(method: CompensationMethod): boolean {
  return method === 'HOURLY_NO_OT' || method === 'HOURLY_OT';
}

export function isBaseMethod(method: CompensationMethod): boolean {
  return method === 'BASE_NO_OT' || method === 'BASE_OT';
}

export function compensationAllowsOvertime(method: CompensationMethod): boolean {
  return method === 'HOURLY_OT' || method === 'BASE_OT';
}

export function defaultRequiresClocking(method: CompensationMethod): boolean {
  if (isHourlyMethod(method)) return true;
  if (method === 'BASE_OT') return true;
  return false;
}

export function formatCompensationMethod(value?: string | null): string {
  const method = normalizeCompensationMethod(value);
  const option = COMPENSATION_METHOD_OPTIONS.find((entry) => entry.value === method);
  return option?.label ?? value ?? '—';
}

export function formatCompensationReason(value?: string | null): string {
  const option = COMPENSATION_REASON_OPTIONS.find((entry) => entry.value === value?.toUpperCase());
  return option?.label ?? value ?? '—';
}

export function standardAnnualHours(standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS): number {
  const weeklyHours = standardWeeklyHours > 0 ? standardWeeklyHours : DEFAULT_STANDARD_WEEKLY_HOURS;
  return Math.round(weeklyHours * 52 * 100) / 100;
}

export function derivedHourlyRateFromYearly(
  yearlyRate: number,
  standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS,
): number {
  if (yearlyRate <= 0) return 0;
  return Math.round((yearlyRate / standardAnnualHours(standardWeeklyHours)) * 100) / 100;
}

export function derivedWeeklyRateFromHourly(
  hourlyRate: number,
  standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS,
): number {
  if (hourlyRate <= 0) return 0;
  const weeklyHours = standardWeeklyHours > 0 ? standardWeeklyHours : DEFAULT_STANDARD_WEEKLY_HOURS;
  return Math.round(hourlyRate * weeklyHours * 100) / 100;
}

export function derivedYearlyRateFromHourly(
  hourlyRate: number,
  standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS,
): number {
  if (hourlyRate <= 0) return 0;
  return Math.round(derivedWeeklyRateFromHourly(hourlyRate, standardWeeklyHours) * 52 * 100) / 100;
}

export function derivedWeeklyRateFromYearly(yearlyRate: number): number {
  if (yearlyRate <= 0) return 0;
  return Math.round((yearlyRate / 52) * 100) / 100;
}

export function derivedMonthlyRateFromYearly(yearlyRate: number): number {
  if (yearlyRate <= 0) return 0;
  return Math.round((yearlyRate / MONTHLY_PAY_PERIODS_PER_YEAR) * 100) / 100;
}

export function derivedBiweeklyRateFromYearly(yearlyRate: number): number {
  if (yearlyRate <= 0) return 0;
  return Math.round((yearlyRate / BIWEEKLY_PAY_PERIODS_PER_YEAR) * 100) / 100;
}

export function isMonthlyPayFrequency(payrateFrequencyName?: string | null): boolean {
  return (payrateFrequencyName ?? '').trim().toLowerCase() === 'monthly';
}

export function isBiweeklyPayFrequency(payrateFrequencyName?: string | null): boolean {
  return (payrateFrequencyName ?? '').trim().toLowerCase() === 'biweekly';
}

export function derivedPeriodRateFromYearly(
  yearlyRate: number,
  payrateFrequencyName?: string | null,
): number {
  if (yearlyRate <= 0) return 0;
  if (isMonthlyPayFrequency(payrateFrequencyName)) {
    return derivedMonthlyRateFromYearly(yearlyRate);
  }
  if (isBiweeklyPayFrequency(payrateFrequencyName)) {
    return derivedBiweeklyRateFromYearly(yearlyRate);
  }
  return 0;
}

export function effectiveYearlyRateFromForm(form: Pick<
  EmployeeCompensationFormModel,
  'compensationMethod' | 'hourlyRate' | 'yearlyRate' | 'standardWeeklyHours'
>): number {
  if (isBaseMethod(form.compensationMethod)) {
    return Number(form.yearlyRate) || 0;
  }

  return derivedYearlyRateFromHourly(
    Number(form.hourlyRate),
    Number(form.standardWeeklyHours),
  );
}

export function effectiveHourlyRateFromRecord(record: {
  compensationMethod?: string | null;
  hourlyRate?: string | number | null;
  yearlyRate?: string | number | null;
  standardWeeklyHours?: string | number | null;
}): number | null {
  const hourlyRate = Number(record.hourlyRate ?? 0);
  if (hourlyRate > 0) return hourlyRate;

  if (isBaseMethod(normalizeCompensationMethod(record.compensationMethod))) {
    const standardWeeklyHours = Number(record.standardWeeklyHours ?? DEFAULT_STANDARD_WEEKLY_HOURS);
    return derivedHourlyRateFromYearly(Number(record.yearlyRate ?? 0), standardWeeklyHours) || null;
  }

  return null;
}

export function formatHourlyRate(record: {
  compensationMethod?: string | null;
  hourlyRate?: string | number | null;
  yearlyRate?: string | number | null;
}): string {
  const rate = effectiveHourlyRateFromRecord(record);
  if (rate == null) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

export function formatYearlyRate(value?: string | number | null): string {
  const rate = Number(value ?? 0);
  if (rate <= 0) return '—';

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rate);
}

export function validateCompensationFields(form: EmployeeCompensationFormModel): string | null {
  if (!form.compensationMethod) return 'Payment method is required.';

  if (isHourlyMethod(form.compensationMethod) && Number(form.hourlyRate) <= 0) {
    return 'Hourly rate is required for hourly payment methods.';
  }

  if (isBaseMethod(form.compensationMethod) && Number(form.yearlyRate) <= 0) {
    return 'Annual base rate is required for base-rate payment methods.';
  }

  if (Number(form.standardWeeklyHours) <= 0) {
    return 'Standard weekly hours must be greater than zero.';
  }

  return null;
}

export function validateEmployeeCompensationForm(form: EmployeeCompensationFormModel): string | null {
  if (!form.employmentDetailId) return 'Employment contract is required.';
  if (!form.effectiveDate) return 'Effective date is required.';
  if (form.endDate && form.endDate < form.effectiveDate) {
    return 'End date must be on or after effective date.';
  }
  if (!form.reasonType) return 'Reason is required.';
  return validateCompensationFields(form);
}

interface EmployeeCompensationRecordSource {
  employmentDetailId?: string | null;
  effectiveDate?: string;
  endDate?: string | null;
  isActive: boolean;
  payscale?: string | null;
  payscalePoint?: string | null;
  compensationMethod?: string | null;
  requiresClocking?: boolean | null;
  hourlyRate?: string | number | null;
  yearlyRate?: string | number | null;
  standardWeeklyHours?: string | number | null;
  reasonType?: string | null;
  reasonNote?: string | null;
}

export function mapEmployeeCompensationRecordToForm(
  record: EmployeeCompensationRecordSource,
): EmployeeCompensationFormModel {
  const compensationMethod = normalizeCompensationMethod(record.compensationMethod);
  const storedHourlyRate = Number(record.hourlyRate ?? 0);
  let yearlyRate = Number(record.yearlyRate ?? 0);
  const standardWeeklyHours = Number(record.standardWeeklyHours ?? DEFAULT_STANDARD_WEEKLY_HOURS);
  let hourlyRate = storedHourlyRate;

  if (hourlyRate <= 0 && yearlyRate > 0) {
    hourlyRate = derivedHourlyRateFromYearly(yearlyRate, standardWeeklyHours);
  }

  if (isHourlyMethod(compensationMethod) && yearlyRate <= 0 && hourlyRate > 0) {
    yearlyRate = derivedYearlyRateFromHourly(hourlyRate, standardWeeklyHours);
  }

  return {
    employmentDetailId: record.employmentDetailId ?? '',
    effectiveDate: record.effectiveDate?.slice(0, 10) ?? '',
    endDate: record.endDate?.slice(0, 10) ?? null,
    isActive: record.isActive,
    payscale: record.payscale ?? '',
    payscalePoint: record.payscalePoint ?? '',
    compensationMethod,
    requiresClocking: record.requiresClocking ?? defaultRequiresClocking(compensationMethod),
    hourlyRate,
    yearlyRate,
    standardWeeklyHours: standardWeeklyHours > 0 ? standardWeeklyHours : DEFAULT_STANDARD_WEEKLY_HOURS,
    reasonType: (record.reasonType?.toUpperCase() as CompensationReasonType) ?? 'OTHER',
    reasonNote: record.reasonNote ?? '',
  };
}
