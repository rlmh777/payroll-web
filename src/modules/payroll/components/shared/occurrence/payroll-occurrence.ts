export const PAYROLL_OCCURRENCE = {
  everyPayroll: 'every_payroll',
  firstOfMonth: 'first_of_month',
  lastOfMonth: 'last_of_month',
  nthOfMonth: 'nth_of_month',
  cycle: 'cycle',
} as const;

export type PayrollOccurrence = (typeof PAYROLL_OCCURRENCE)[keyof typeof PAYROLL_OCCURRENCE];

export interface PayrollOccurrenceFields {
  occurrence: PayrollOccurrence;
  occurrenceCycleLength: number | null;
  occurrenceCycleOffset: number | null;
}

export const PAYROLL_OCCURRENCE_OPTIONS = [
  {
    label: 'Every payroll',
    value: PAYROLL_OCCURRENCE.everyPayroll,
  },
  {
    label: 'First payroll of the month',
    value: PAYROLL_OCCURRENCE.firstOfMonth,
  },
  {
    label: 'Last payroll of the month',
    value: PAYROLL_OCCURRENCE.lastOfMonth,
  },
  {
    label: 'Payroll N of the month',
    value: PAYROLL_OCCURRENCE.nthOfMonth,
  },
  {
    label: 'Every Nth payroll (cycle)',
    value: PAYROLL_OCCURRENCE.cycle,
  },
];

export function defaultPayrollOccurrenceFields(): PayrollOccurrenceFields {
  return {
    occurrence: PAYROLL_OCCURRENCE.everyPayroll,
    occurrenceCycleLength: null,
    occurrenceCycleOffset: null,
  };
}

export function normalizePayrollOccurrenceFields(fields: PayrollOccurrenceFields): PayrollOccurrenceFields {
  if (fields.occurrence === PAYROLL_OCCURRENCE.cycle) {
    return {
      occurrence: fields.occurrence,
      occurrenceCycleLength: fields.occurrenceCycleLength,
      occurrenceCycleOffset: fields.occurrenceCycleOffset,
    };
  }

  if (fields.occurrence === PAYROLL_OCCURRENCE.nthOfMonth) {
    return {
      occurrence: fields.occurrence,
      occurrenceCycleLength: null,
      occurrenceCycleOffset: fields.occurrenceCycleOffset,
    };
  }

  return {
    occurrence: fields.occurrence,
    occurrenceCycleLength: null,
    occurrenceCycleOffset: null,
  };
}

export function formatPayrollOccurrence(fields: {
  occurrence?: string | null;
  occurrenceCycleLength?: number | null;
  occurrenceCycleOffset?: number | null;
}): string {
  const occurrence = fields.occurrence || PAYROLL_OCCURRENCE.everyPayroll;
  const option = PAYROLL_OCCURRENCE_OPTIONS.find((entry) => entry.value === occurrence);

  if (occurrence === PAYROLL_OCCURRENCE.nthOfMonth) {
    const slot = fields.occurrenceCycleOffset ?? 1;
    return `Payroll ${slot} of the month`;
  }

  if (occurrence === PAYROLL_OCCURRENCE.cycle) {
    const length = fields.occurrenceCycleLength ?? 2;
    const slot = fields.occurrenceCycleOffset ?? 1;
    return `Cycle: payday ${slot} of ${length}`;
  }

  return option?.label || 'Every payroll';
}
