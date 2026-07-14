<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-group-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Pay Period Group</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            :rules="[val => !!val || 'Name is required']"
            :disable="payPeriodGroupStore.isLoading"
          />

          <q-select
            v-model="form.status"
            :options="statusOptions"
            label="Status *"
            outlined
            emit-value
            map-options
            :rules="[val => !!val || 'Status is required']"
            :disable="payPeriodGroupStore.isLoading"
          />

          <q-checkbox
            v-model="form.isDefault"
            label="Set as Default"
            :disable="payPeriodGroupStore.isLoading"
          />

          <q-input
            v-model="form.rules"
            label="Rules"
            type="textarea"
            outlined
            rows="5"
            :disable="payPeriodGroupStore.isLoading"
          />
          <div class="text-body2 text-grey-7 q-mt-xs q-mb-md">
            <div class="q-mb-xs"><strong>Examples:</strong></div>
            <div class="q-mb-xs">• frequency = BIWEEKLY | MONTHLY</div>
            <div class="q-mb-xs">• anchor_date (for biweekly) = a known pay date or period start you can count from</div>
            <div class="q-mb-xs">• monthly_rule = e.g. LAST_BUSINESS_DAY, NTH_BUSINESS_DAY, or DAY_OF_MONTH + ADJUST</div>
            <div class="q-mb-xs">• target_day_of_month (if applicable) = 15, 25, etc.</div>
            <div class="q-mb-xs">• weekend_holiday_policy = PREVIOUS_BUSINESS_DAY or NEXT_BUSINESS_DAY</div>
            <div class="q-mb-xs">• holiday_calendar_id (Belize holidays, bank holidays, etc.)</div>
            <div class="q-mb-xs">• (optional) pay_delay_days, cutoff_offset_days, approval_offset_days</div>
          </div>

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="payPeriodGroupStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="payPeriodGroupStore.isLoading"
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
import { usePayPeriodGroupStore, type PayPeriodGroup } from '@/stores/pay-period-group-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  record: PayPeriodGroup | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  record: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [recordId: string];
}>();

const payPeriodGroupStore = usePayPeriodGroupStore();

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  status: 'active' as 'active' | 'inactive',
  isDefault: false,
  rules: null as string | null,
});

const onSubmit = async () => {
  if (!props.record) return;

  try {
    const updatedGroup = await payPeriodGroupStore.updatePayPeriodGroup(
      props.record.id,
      form.value.name || undefined,
      form.value.status || undefined,
      form.value.isDefault,
      form.value.rules !== null ? form.value.rules : undefined
    );

    if (updatedGroup) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Pay period group updated successfully!',
      });
      emit('updated', updatedGroup.id);
      onClose();
    } else if (payPeriodGroupStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: payPeriodGroupStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update pay period group';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load record data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.record) {
    form.value = {
      name: props.record.name,
      status: props.record.status,
      isDefault: props.record.isDefault,
      rules: props.record.rules || null,
    };
  }
});
</script>

<style scoped>
.edit-group-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-group-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
