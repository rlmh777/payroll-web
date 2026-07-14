<template>
  <q-card flat bordered class="period-control q-mb-md">
    <q-card-section class="row items-center q-col-gutter-md">
      <div class="col-12 col-lg-5">
        <div class="text-overline text-primary">Working pay period</div>
        <q-select
          :model-value="props.selectedPayPeriodId"
          outlined
          dense
          emit-value
          map-options
          label="Select pay period"
          :loading="props.isLoadingPayPeriods"
          :options="payPeriodOptions"
          @update:model-value="emit('update:selectedPayPeriodId', ($event as string | null) ?? null)"
        >
          <template #prepend><q-icon name="date_range" /></template>
        </q-select>
      </div>

      <div class="col-12 col-sm-6 col-lg">
        <div class="period-fact">
          <q-icon name="calendar_today" color="primary" size="20px" />
          <div>
            <div class="text-caption text-grey-7">Period dates</div>
            <div class="text-weight-medium">{{ periodDates }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-sm-6 col-lg">
        <div class="period-fact">
          <q-icon name="payments" color="positive" size="22px" />
          <div>
            <div class="text-caption text-grey-7">Pay date</div>
            <div class="text-weight-medium">{{ payDate }}</div>
          </div>
        </div>
      </div>
      <div class="col-12 col-lg-auto">
        <q-btn
          v-if="props.issueCount > 0"
          unelevated
          color="warning"
          text-color="white"
          icon="warning_amber"
          :label="`Review ${props.issueCount} exceptions`"
          @click="emit('reviewIssues')"
        />
        <q-chip v-else color="green-1" text-color="positive" icon="task_alt" label="No exceptions in current view" />
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { PayPeriodSchedule } from '@payroll/stores/attendance-store';
import { formatDate } from './utils';

const props = defineProps<{
  payPeriods: PayPeriodSchedule[];
  selectedPayPeriodId: string | null;
  isLoadingPayPeriods: boolean;
  issueCount: number;
}>();

const emit = defineEmits<{
  (event: 'update:selectedPayPeriodId', value: string | null): void;
  (event: 'reviewIssues'): void;
}>();

const selectedPeriod = computed(() =>
  props.payPeriods.find((period) => period.id === props.selectedPayPeriodId),
);
const payPeriodOptions = computed(() =>
  props.payPeriods.map((period) => ({
    value: period.id,
    label: `${formatDate(period.startDate)} – ${formatDate(period.endDate)} · Pay ${formatDate(period.payDate)}`,
  })),
);
const periodDates = computed(() =>
  selectedPeriod.value
    ? `${formatDate(selectedPeriod.value.startDate)} – ${formatDate(selectedPeriod.value.endDate)}`
    : 'Select a pay period',
);
const payDate = computed(() =>
  selectedPeriod.value ? formatDate(selectedPeriod.value.payDate) : 'Not selected',
);
</script>

<style scoped>
.period-control {
  border-radius: 14px;
  border-color: #cbd9eb;
  background: linear-gradient(135deg, #fff 0%, #f5f9ff 100%);
}

.period-fact {
  display: flex;
  align-items: center;
  min-height: 54px;
  gap: 12px;
}
</style>
