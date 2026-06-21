<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-group-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Pay Period Group</div>
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
              label="Save"
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
import { usePayPeriodGroupStore } from '../../../stores/pay-period-group-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [recordId: string];
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
  if (!form.value.name || !form.value.status) {
    return;
  }

  try {
    const newGroup = await payPeriodGroupStore.createPayPeriodGroup(
      crypto.randomUUID(),
      form.value.name,
      form.value.status,
      form.value.isDefault,
      form.value.rules || null
    );

    if (newGroup) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Pay period group created successfully!',
      });
      emit('saved', newGroup.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create pay period group';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  form.value = {
    name: '',
    status: 'active',
    isDefault: false,
    rules: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      status: 'active',
      isDefault: false,
      rules: null,
    };
  }
});
</script>

<style scoped>
.add-group-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-group-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
