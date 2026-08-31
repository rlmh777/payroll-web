<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-allowance-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Other Payment</div>
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
              label="Save"
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

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [allowanceId: string];
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
  if (!form.value.name || form.value.defaultAmount === null || form.value.defaultAmount === undefined) {
    return;
  }

  try {
    const newAllowance = await allowanceStore.createAllowance(
      form.value.name,
      form.value.defaultAmount,
      form.value.isTaxable,
      form.value.isSocialSecurityDeductable,
      form.value.note || null
    );

    if (newAllowance) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Other Payment created successfully!',
      });
      emit('saved', newAllowance.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create other payment';
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
    defaultAmount: null,
    isTaxable: false,
    isSocialSecurityDeductable: false,
    note: '',
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      defaultAmount: null,
      isTaxable: false,
      isSocialSecurityDeductable: false,
      note: '',
    };
  }
});
</script>

<style scoped>
.add-allowance-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-allowance-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

