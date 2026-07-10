import type { PayPeriodSchedule } from 'src/stores/pay-period-schedule-store';

export interface PayPeriodScheduleFormModel {
  start_date: string | null;
  end_date: string | null;
  pay_date: string | null;
}

export function createEmptyPayPeriodScheduleForm(): PayPeriodScheduleFormModel {
  return {
    start_date: null,
    end_date: null,
    pay_date: null,
  };
}

export function mapScheduleToForm(record: PayPeriodSchedule): PayPeriodScheduleFormModel {
  return {
    start_date: record.start_date ?? null,
    end_date: record.end_date ?? null,
    pay_date: record.pay_date ?? null,
  };
}

export function validatePayPeriodScheduleForm(form: PayPeriodScheduleFormModel): string | null {
  if (!form.start_date || !form.end_date || !form.pay_date) {
    return 'Start date, end date, and pay date are required.';
  }

  if (form.end_date < form.start_date) {
    return 'End date must be on or after the start date.';
  }

  if (form.pay_date < form.end_date) {
    return 'Pay date must be on or after the end date.';
  }

  return null;
}
