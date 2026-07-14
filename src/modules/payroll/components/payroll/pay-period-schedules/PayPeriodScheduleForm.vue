<template>
  <div class="q-gutter-md">
    <SsBenefitDateField
      v-model="form.start_date"
      label="Start date *"
      required
      :disable="props.disable"
    />
    <SsBenefitDateField
      v-model="form.end_date"
      label="End date *"
      required
      :disable="props.disable"
    />
    <SsBenefitDateField
      v-model="form.pay_date"
      label="Pay date *"
      required
      :disable="props.disable"
    />
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';
import type { PayPeriodScheduleFormModel } from './pay-period-schedule-form';

const props = withDefaults(defineProps<{
  modelValue: PayPeriodScheduleFormModel;
  disable?: boolean;
}>(), {
  disable: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: PayPeriodScheduleFormModel];
}>();

const form = reactive<PayPeriodScheduleFormModel>({ ...props.modelValue });

watch(
  () => props.modelValue,
  (value) => {
    Object.assign(form, value);
  },
  { deep: true },
);

watch(
  form,
  (value) => {
    emit('update:modelValue', { ...value });
  },
  { deep: true },
);
</script>
