<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-allowance-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Other Payment</div>
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
            :disable="allowanceStore.isLoading"
          />

          <q-input
            v-model.number="form.defaultAmount"
            label="Default Amount *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[
              val => val !== null && val !== undefined && val >= 0 || 'Default amount is required',
              val => val <= 9999999999.99 || 'Amount must be less than 10,000,000,000'
            ]"
            :disable="allowanceStore.isLoading"
          />

          <q-checkbox
            v-model="form.isTaxable"
            label="Is Taxable"
            :disable="allowanceStore.isLoading"
          />

          <q-checkbox
            v-model="form.isSocialSecurityDeductable"
            label="Is Social Security Deductable"
            :disable="allowanceStore.isLoading"
          />

          <q-input
            v-model="form.note"
            label="Note"
            type="textarea"
            outlined
            rows="3"
            maxlength="1024"
            counter
            :disable="allowanceStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="allowanceStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="allowanceStore.isLoading"
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
import { useAllowanceStore } from '@payroll/stores/allowance-store';
import type { Allowance } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  allowance: Allowance | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  allowance: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [allowanceId: string];
}>();

const allowanceStore = useAllowanceStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  defaultAmount: null as number | null,
  isTaxable: false,
  isSocialSecurityDeductable: false,
  note: '',
});

const onSubmit = async () => {
  if (!form.value.name || form.value.defaultAmount === null || form.value.defaultAmount === undefined || !props.allowance) {
    return;
  }

  try {
    const updatedAllowance = await allowanceStore.updateAllowance(
      props.allowance.id,
      form.value.name,
      form.value.defaultAmount,
      form.value.isTaxable,
      form.value.isSocialSecurityDeductable,
      form.value.note || null
    );

    if (updatedAllowance) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Other Payment updated successfully!',
      });
      emit('updated', updatedAllowance.id);
      onClose();
    } else if (allowanceStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: allowanceStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update other payment';
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

// Load allowance data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.allowance) {
    // Populate form with existing data
    form.value = {
      name: props.allowance.name || '',
      defaultAmount: props.allowance.defaultAmount !== null && props.allowance.defaultAmount !== undefined ? props.allowance.defaultAmount : null,
      isTaxable: props.allowance.isTaxable || false,
      isSocialSecurityDeductable: props.allowance.isSocialSecurityDeductable || false,
      note: props.allowance.note || '',
    };
  }
});
</script>

<style scoped>
.edit-allowance-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-allowance-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

