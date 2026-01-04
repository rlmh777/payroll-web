<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-deduction-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Deduction Type</div>
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
              label="Save"
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
import { useAuthStore } from '../../stores/auth';
import { useDeductionTypeStore } from '../../stores/deduction-type-store';

const $q = useQuasar();
const authStore = useAuthStore();
const deductionTypeStore = useDeductionTypeStore();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [deductionTypeId: number];
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
});

const onSubmit = async () => {
  if (!form.value.name || form.value.defaultAmount === null || form.value.defaultAmount === undefined) {
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

    const body = {
      name: form.value.name,
      defaultAmount: form.value.defaultAmount,
      note: form.value.note || null,
    };

    const response = await fetch(`${API_URL}/deduction-types`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to create deduction type: ${response.statusText}`);
    }

    const result = await response.json();
    const newDeductionType = result.data || result;

    // Refresh deduction types
    await deductionTypeStore.fetchDeductionTypes();

    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Deduction type created successfully!',
    });

    emit('saved', newDeductionType.id);
    onClose();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create deduction type';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  } finally {
    isLoading.value = false;
  }
};

const onClose = () => {
  form.value = {
    name: '',
    defaultAmount: null,
    note: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      defaultAmount: null,
      note: null,
    };
  }
});
</script>

<style scoped>
.add-deduction-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-deduction-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

