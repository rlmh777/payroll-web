<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="schedule-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Pay Period Schedule</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <PayPeriodScheduleForm
            v-model="form"
            :disable="payPeriodScheduleStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              :disable="payPeriodScheduleStore.isLoading"
              @click="onClose"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="payPeriodScheduleStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePayPeriodScheduleStore } from '@payroll/stores/pay-period-schedule-store';
import PayPeriodScheduleForm from './PayPeriodScheduleForm.vue';
import {
  createEmptyPayPeriodScheduleForm,
  validatePayPeriodScheduleForm,
  type PayPeriodScheduleFormModel,
} from './pay-period-schedule-form';

const props = defineProps<{
  modelValue: boolean;
  payPeriodGroupId: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const payPeriodScheduleStore = usePayPeriodScheduleStore();
const form = ref<PayPeriodScheduleFormModel>(createEmptyPayPeriodScheduleForm());

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

async function onSubmit() {
  const validationError = validatePayPeriodScheduleForm(form.value);
  if (validationError) {
    $q.notify({ color: 'negative', position: 'top', message: validationError });
    return;
  }

  const success = await payPeriodScheduleStore.createPayPeriodSchedule(
    crypto.randomUUID(),
    form.value.start_date!,
    form.value.end_date!,
    form.value.pay_date!,
    props.payPeriodGroupId,
  );

  if (!success) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: payPeriodScheduleStore.error || 'Failed to create pay period schedule.',
    });
    return;
  }

  if (props.payPeriodGroupId) {
    await payPeriodScheduleStore.fetchPayPeriodSchedules(
      payPeriodScheduleStore.currentPage,
      10,
      props.payPeriodGroupId,
    );
  }

  $q.notify({
    color: 'positive',
    position: 'top',
    message: 'Pay period schedule created successfully.',
  });
  emit('saved');
  onClose();
}

function onClose() {
  form.value = createEmptyPayPeriodScheduleForm();
  isOpen.value = false;
}

watch(isOpen, (open) => {
  if (open) {
    form.value = createEmptyPayPeriodScheduleForm();
  }
});
</script>

<style scoped>
.schedule-drawer-card {
  width: 34vw;
  max-width: 460px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.schedule-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
