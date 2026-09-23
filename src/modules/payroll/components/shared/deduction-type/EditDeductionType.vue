<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-deduction-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Deduction Type</div>
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
            :disable="isLoading"
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
              val => val <= 9999999999.99 || 'Default amount must be less than 10,000,000,000'
            ]"
            :disable="isLoading"
          />

          <AccountSelect
            v-model="form.accountId"
            :rules="[(val: string | null | undefined) => !!val || 'Account is required']"
            :disable="isLoading"
            :showAddNew="true"
            :showEdit="true"
            hint="GL account used when this deduction is processed on payroll."
          />

          <q-input
            v-model="form.note"
            label="Note"
            type="textarea"
            outlined
            rows="3"
            maxlength="1024"
            counter
            :disable="isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="isLoading"
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
import { useAuthStore } from '@core/stores/auth';
import { useDeductionTypeStore } from '@payroll/stores/deduction-type-store';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';
import type { DeductionType } from '@core/types/models';

const $q = useQuasar();
const authStore = useAuthStore();
const deductionTypeStore = useDeductionTypeStore();

interface Props {
  modelValue: boolean;
  deductionType: DeductionType | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  deductionType: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [deductionTypeId: number];
}>();

const isLoading = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  defaultAmount: null as number | null,
  note: null as string | null,
  accountId: null as string | null,
});

const onSubmit = async () => {
  if (
    !form.value.name
    || form.value.defaultAmount === null
    || form.value.defaultAmount === undefined
    || !form.value.accountId
    || !props.deductionType
  ) {
    return;
  }

  isLoading.value = true;

  try {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const response = await fetch(`${API_URL}/deduction-types/${props.deductionType.id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        name: form.value.name,
        defaultAmount: form.value.defaultAmount,
        note: form.value.note || null,
        accountId: form.value.accountId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to update deduction type: ${response.statusText}`);
    }

    await deductionTypeStore.fetchDeductionTypes();

    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Deduction type updated successfully!',
    });

    emit('updated', props.deductionType.id);
    onClose();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update deduction type',
    });
  } finally {
    isLoading.value = false;
  }
};

const onClose = () => {
  isOpen.value = false;
};

watch(isOpen, (newValue) => {
  if (newValue && props.deductionType) {
    form.value = {
      name: props.deductionType.name || '',
      defaultAmount: props.deductionType.defaultAmount ?? null,
      note: props.deductionType.note || null,
      accountId: props.deductionType.accountId ?? props.deductionType.account?.id ?? null,
    };
  }
});
</script>

<style scoped>
.edit-deduction-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-deduction-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
