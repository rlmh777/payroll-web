<template>
  <q-dialog :model-value="props.modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card class="processing-dialog">
      <q-card-section class="row items-start no-wrap q-gutter-md">
        <q-avatar color="blue-1" text-color="primary" icon="auto_fix_high" />
        <div>
          <div class="text-h6 text-weight-bold">Generate timesheets</div>
          <div class="text-body2 text-grey-7">
            Create employee timesheets for a pay cycle from clocking events and assigned work schedules.
          </div>
        </div>
        <q-space />
        <q-btn flat round dense icon="close" :disable="props.isProcessing" v-close-popup />
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-select
          :model-value="props.selectedPayPeriodId"
          outlined
          clearable
          emit-value
          map-options
          label="Pay period"
          hint="Recommended: selecting a pay period keeps processing and review dates aligned."
          :loading="props.isLoadingPayPeriods"
          :options="payPeriodOptions"
          @update:model-value="emit('update:selectedPayPeriodId', ($event as string | null) ?? null)"
        >
          <template #prepend><q-icon name="date_range" /></template>
        </q-select>

        <q-expansion-item
          class="advanced-options q-mt-md"
          icon="tune"
          label="Advanced processing options"
          caption="Use only for an ad-hoc date range, one employee, or an authorized OT override."
        >
          <q-card-section class="q-px-none q-pb-none">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="props.startDate"
                  type="date"
                  outlined
                  stack-label
                  label="Ad-hoc start date"
                  :disable="Boolean(props.selectedPayPeriodId)"
                  @update:model-value="emit('update:startDate', String($event ?? ''))"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="props.endDate"
                  type="date"
                  outlined
                  stack-label
                  label="Ad-hoc end date"
                  :disable="Boolean(props.selectedPayPeriodId)"
                  @update:model-value="emit('update:endDate', String($event ?? ''))"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="props.biometricUserId"
                  outlined
                  clearable
                  label="Employee / biometric ID"
                  hint="Leave blank to process all active employees."
                  @update:model-value="emit('update:biometricUserId', String($event ?? ''))"
                >
                  <template #prepend><q-icon name="badge" /></template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  :model-value="props.overtimeThresholdHours"
                  type="number"
                  min="0"
                  step="0.25"
                  outlined
                  clearable
                  suffix="hrs"
                  label="Daily OT override"
                  hint="Blank uses each employee's assigned schedule."
                  @update:model-value="updateOvertimeThreshold"
                >
                  <template #prepend><q-icon name="more_time" /></template>
                </q-input>
              </div>
            </div>
          </q-card-section>
        </q-expansion-item>

        <q-banner rounded class="processing-rules q-mt-lg">
          <template #avatar><q-icon name="rule" color="primary" /></template>
          <div class="text-weight-medium q-mb-xs">Processing rules</div>
          <div class="text-caption text-grey-8">
            Valid punch-in/out pairs produce worked hours. Regular hours are capped at the assigned schedule or
            override, and the remainder becomes overtime. Base-salary employees without punches receive scheduled
            hours; hourly employees without punches receive unpaid scheduled hours.
          </div>
        </q-banner>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey-8" label="Cancel" :disable="props.isProcessing" v-close-popup />
        <q-btn
          unelevated
          color="primary"
          icon="auto_fix_high"
          label="Generate timesheets"
          :loading="props.isProcessing"
          :disable="!canSubmit"
          @click="emit('submit')"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PayPeriodSchedule } from 'src/stores/attendance-store';

const props = defineProps<{
  modelValue: boolean;
  payPeriods: PayPeriodSchedule[];
  selectedPayPeriodId: string | null;
  startDate: string;
  endDate: string;
  biometricUserId: string;
  overtimeThresholdHours: number | null;
  isLoadingPayPeriods: boolean;
  isProcessing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'update:selectedPayPeriodId', value: string | null): void;
  (event: 'update:startDate', value: string): void;
  (event: 'update:endDate', value: string): void;
  (event: 'update:biometricUserId', value: string): void;
  (event: 'update:overtimeThresholdHours', value: number | null): void;
  (event: 'submit'): void;
}>();

const payPeriodOptions = computed(() =>
  props.payPeriods.map((period) => ({
    value: period.id,
    label: `${formatDate(period.startDate)} – ${formatDate(period.endDate)} · Pay ${formatDate(period.payDate)}`,
  })),
);

const canSubmit = computed(
  () =>
    Boolean(props.selectedPayPeriodId) ||
    (Boolean(props.startDate) && Boolean(props.endDate) && props.endDate >= props.startDate),
);

function formatDate(value: string) {
  const normalized = value.slice(0, 10);
  const date = new Date(`${normalized}T00:00:00`);

  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
}

function updateOvertimeThreshold(value: string | number | null) {
  if (value === null || value === '') {
    emit('update:overtimeThresholdHours', null);
    return;
  }

  const parsed = Number(value);
  emit('update:overtimeThresholdHours', Number.isFinite(parsed) ? parsed : null);
}
</script>

<style scoped>
.processing-dialog {
  width: min(760px, calc(100vw - 32px));
  max-width: 760px;
  border-radius: 14px;
}

.processing-rules {
  border: 1px solid #cfe0f7;
  background: #f5f9fe;
}

.advanced-options {
  border: 1px solid #dce4ed;
  border-radius: 10px;
  background: #fbfcfe;
}
</style>
