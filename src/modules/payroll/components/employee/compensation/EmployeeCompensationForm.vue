<template>
  <div class="compensation-form">
    <q-select
      v-model="model.employmentDetailId"
      :options="employmentDetailOptions"
      label="Employment contract *"
      dense
      outlined
      emit-value
      map-options
      :disable="props.disable"
    />

    <div class="compensation-form__row compensation-form__row--2">
      <SsBenefitDateField
        v-model="model.effectiveDate"
        label="Effective date *"
        required
        :disable="props.disable"
      />
      <SsBenefitDateField
        v-model="model.endDate"
        label="End date"
        clearable
        :disable="props.disable"
      />
    </div>

    <q-toggle v-model="model.isActive" label="Active compensation" :disable="props.disable" />

    <q-select
      v-model="model.compensationMethod"
      :options="compensationMethodOptions"
      label="Payment method *"
      dense
      outlined
      emit-value
      map-options
      :disable="props.disable"
      @update:model-value="onCompensationMethodChange"
    >
      <template #option="scope">
        <q-item v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.label }}</q-item-label>
            <q-item-label caption>{{ scope.opt.description }}</q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <q-toggle
      v-model="model.requiresClocking"
      label="Requires clock in/out"
      :disable="props.disable || clockingLocked"
      :hint="clockingHint"
    />

    <div class="compensation-form__row compensation-form__row--2">
      <q-input
        v-model="model.payscale"
        label="Payscale (optional)"
        dense
        outlined
        maxlength="16"
        :disable="props.disable"
      />
      <q-input
        v-model="model.payscalePoint"
        label="Payscale point (optional)"
        dense
        outlined
        maxlength="8"
        :disable="props.disable"
      />
    </div>

    <div class="compensation-form__row compensation-form__row--2">
      <q-select
        v-model="model.reasonType"
        :options="reasonOptions"
        label="Reason *"
        dense
        outlined
        emit-value
        map-options
        class="compensation-form__reason"
        :disable="props.disable"
      />
    </div>

    <div class="compensation-form__row compensation-form__row--2">
      <q-input
        v-if="isHourlyMethod(model.compensationMethod)"
        v-model.number="model.hourlyRate"
        type="number"
        step="0.01"
        min="0"
        label="Hourly rate *"
        dense
        outlined
        :disable="props.disable"
        @update:model-value="syncDerivedRates"
      />
      <q-input
        v-if="isBaseMethod(model.compensationMethod)"
        v-model.number="model.yearlyRate"
        type="number"
        step="0.01"
        min="0"
        label="Annual base rate *"
        dense
        outlined
        :disable="props.disable"
        @update:model-value="syncDerivedRates"
      />
      <q-input
        v-model.number="model.standardWeeklyHours"
        type="number"
        step="0.5"
        min="0.5"
        max="168"
        label="Standard weekly hours *"
        dense
        outlined
        :hint="standardWeeklyHoursHint"
        :disable="props.disable"
        @update:model-value="syncDerivedRates"
      />
      <q-input
        v-if="isHourlyMethod(model.compensationMethod)"
        :model-value="derivedWeeklyDisplay"
        label="Weekly base pay"
        dense
        outlined
        readonly
        :disable="props.disable"
      />
      <q-input
        v-if="isHourlyMethod(model.compensationMethod)"
        :model-value="derivedAnnualDisplay"
        label="Annual base pay"
        dense
        outlined
        readonly
        :disable="props.disable"
      />
      <q-input
        v-if="isBaseMethod(model.compensationMethod)"
        :model-value="derivedHourlyDisplay"
        label="Equivalent hourly rate"
        dense
        outlined
        readonly
        :disable="props.disable"
      />
      <q-input
        v-if="isBaseMethod(model.compensationMethod)"
        :model-value="derivedBaseWeeklyDisplay"
        label="Estimated weekly base pay"
        dense
        outlined
        readonly
        :disable="props.disable"
      />
      <q-input
        v-if="isBaseMethod(model.compensationMethod)"
        :model-value="derivedBaseMonthlyDisplay"
        label="Estimated monthly base pay"
        dense
        outlined
        readonly
        :disable="props.disable"
      />
      <q-input
        v-if="showMonthlyPeriodBasePay"
        :model-value="derivedPeriodDisplay"
        :label="periodBasePayLabel"
        dense
        outlined
        readonly
        :hint="periodBasePayHint"
        :disable="props.disable"
      />
      <q-input
        v-if="showBiweeklyPeriodBasePay"
        :model-value="derivedPeriodDisplay"
        :label="periodBasePayLabel"
        dense
        outlined
        readonly
        :hint="periodBasePayHint"
        :disable="props.disable"
      />
    </div>

    <q-input
      v-model="model.reasonNote"
      type="textarea"
      label="Reason note"
      dense
      outlined
      :disable="props.disable"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';
import {
  COMPENSATION_METHOD_OPTIONS,
  COMPENSATION_REASON_OPTIONS,
  compensationAllowsOvertime,
  defaultRequiresClocking,
  derivedHourlyRateFromYearly,
  derivedMonthlyRateFromYearly,
  derivedPeriodRateFromYearly,
  derivedWeeklyRateFromHourly,
  derivedWeeklyRateFromYearly,
  derivedYearlyRateFromHourly,
  DEFAULT_STANDARD_WEEKLY_HOURS,
  effectiveYearlyRateFromForm,
  isBaseMethod,
  isBiweeklyPayFrequency,
  isHourlyMethod,
  isMonthlyPayFrequency,
  type CompensationMethod,
  type EmployeeCompensationFormModel,
} from './compensation-form';
import type { EmploymentDetail } from 'src/stores/employment-detail-store';

const props = withDefaults(defineProps<{
  disable?: boolean;
  employmentDetails?: EmploymentDetail[];
  payrateFrequencyName: string | null;
}>(), {
  disable: false,
  employmentDetails: () => [],
  payrateFrequencyName: null,
});

const model = defineModel<EmployeeCompensationFormModel>({ required: true });

const compensationMethodOptions = COMPENSATION_METHOD_OPTIONS;
const reasonOptions = COMPENSATION_REASON_OPTIONS;

const employmentDetailOptions = computed(() => props.employmentDetails.map((detail) => ({
  label: formatEmploymentDetailLabel(detail),
  value: detail.id,
})));

const clockingLocked = computed(() => isHourlyMethod(model.value.compensationMethod));

const clockingHint = computed(() => {
  if (clockingLocked.value) {
    return 'Hourly payment methods always require clocking.';
  }

  return 'Track attendance even when pay is not tied to punches.';
});

const standardWeeklyHoursHint = computed(() => {
  if (isHourlyMethod(model.value.compensationMethod)) {
    return 'Used with the hourly rate to define weekly and annual base pay.';
  }

  return 'Used to derive the equivalent hourly rate from annual base.';
});

const derivedHourlyDisplay = computed(() => {
  if (!isBaseMethod(model.value.compensationMethod)) {
    return '0.00';
  }

  return derivedHourlyRateFromYearly(
    Number(model.value.yearlyRate),
    Number(model.value.standardWeeklyHours),
  ).toFixed(2);
});

const derivedBaseWeeklyDisplay = computed(() => {
  if (!isBaseMethod(model.value.compensationMethod)) {
    return '0.00';
  }

  return derivedWeeklyRateFromYearly(Number(model.value.yearlyRate)).toFixed(2);
});

const derivedBaseMonthlyDisplay = computed(() => {
  if (!isBaseMethod(model.value.compensationMethod)) {
    return '0.00';
  }

  return derivedMonthlyRateFromYearly(Number(model.value.yearlyRate)).toFixed(2);
});

const derivedWeeklyDisplay = computed(() => (
  derivedWeeklyRateFromHourly(
    Number(model.value.hourlyRate),
    Number(model.value.standardWeeklyHours),
  ).toFixed(2)
));

const derivedAnnualDisplay = computed(() => (
  derivedYearlyRateFromHourly(
    Number(model.value.hourlyRate),
    Number(model.value.standardWeeklyHours),
  ).toFixed(2)
));

const effectiveAnnualRate = computed(() => effectiveYearlyRateFromForm(model.value));

const showBiweeklyPeriodBasePay = computed(() => (
  !compensationAllowsOvertime(model.value.compensationMethod)
  && isBiweeklyPayFrequency(props.payrateFrequencyName)
));

const showMonthlyPeriodBasePay = computed(() => (
  !compensationAllowsOvertime(model.value.compensationMethod)
  && isMonthlyPayFrequency(props.payrateFrequencyName)
));

const periodBasePayLabel = computed(() => {
  if (showMonthlyPeriodBasePay.value) {
    return 'Payroll monthly base pay';
  }

  if (showBiweeklyPeriodBasePay.value) {
    return 'Payroll biweekly base pay';
  }

  return 'Period base pay';
});

const periodBasePayHint = computed(() => {
  if (showMonthlyPeriodBasePay.value) {
    return 'Fixed pay per monthly payroll run. Clocked hours do not change this amount.';
  }

  if (showBiweeklyPeriodBasePay.value) {
    return 'Fixed pay per biweekly payroll run. Clocked hours do not change this amount.';
  }

  return 'Fixed pay for the payroll period.';
});

const derivedPeriodDisplay = computed(() => (
  derivedPeriodRateFromYearly(effectiveAnnualRate.value, props.payrateFrequencyName).toFixed(2)
));

function syncDerivedRates() {
  if (Number(model.value.standardWeeklyHours) <= 0) {
    model.value.standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS;
  }

  if (isHourlyMethod(model.value.compensationMethod)) {
    model.value.yearlyRate = derivedYearlyRateFromHourly(
      Number(model.value.hourlyRate),
      Number(model.value.standardWeeklyHours),
    );
    return;
  }

  if (isBaseMethod(model.value.compensationMethod) && Number(model.value.yearlyRate) > 0) {
    model.value.hourlyRate = derivedHourlyRateFromYearly(
      Number(model.value.yearlyRate),
      Number(model.value.standardWeeklyHours),
    );
  }
}

function onCompensationMethodChange(value: CompensationMethod) {
  model.value.requiresClocking = defaultRequiresClocking(value);

  if (Number(model.value.standardWeeklyHours) <= 0) {
    model.value.standardWeeklyHours = DEFAULT_STANDARD_WEEKLY_HOURS;
  }

  syncDerivedRates();
}

function formatEmploymentDetailLabel(detail: EmploymentDetail): string {
  const title = detail.jobTitle || detail.contractType?.name || 'Contract';
  const department = detail.department?.name ?? 'No department';
  const payPeriodGroup = detail.defaultPayPeriodGroup?.name ?? 'No pay period group';
  const dates = `${detail.startDate}${detail.endDate ? ` to ${detail.endDate}` : ' onward'}`;

  return `${title} - ${department} - ${payPeriodGroup} (${dates})`;
}
</script>

<style scoped>
.compensation-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.compensation-form__row {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}

@media (min-width: 600px) {
  .compensation-form__row--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.compensation-form__reason {
  grid-column: 1 / -1;
}
</style>
