<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-payrate-frequency-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Pay Rate Frequency</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            maxlength="64"
            counter
            :rules="[val => !!val || 'Name is required']"
            :disable="payrateFrequencyStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="payrateFrequencyStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="payrateFrequencyStore.isLoading"
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
import { usePayrateFrequencyStore } from '@payroll/stores/payrate-frequency-store';
import type { PayrateFrequency } from '@core/types/models';

const $q = useQuasar();
const payrateFrequencyStore = usePayrateFrequencyStore();

interface Props {
  modelValue: boolean;
  payrateFrequency: PayrateFrequency | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  payrateFrequency: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [payrateFrequencyId: number];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
});

const onSubmit = async () => {
  if (!form.value.name.trim() || !props.payrateFrequency) {
    return;
  }

  try {
    const updatedPayrateFrequency = await payrateFrequencyStore.updatePayrateFrequency(
      props.payrateFrequency.id,
      form.value.name.trim()
    );

    if (updatedPayrateFrequency) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Pay rate frequency updated successfully!',
      });
      emit('updated', updatedPayrateFrequency.id);
      onClose();
    } else if (payrateFrequencyStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: payrateFrequencyStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update pay rate frequency';
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

watch(isOpen, (newValue) => {
  if (newValue && props.payrateFrequency) {
    form.value = {
      name: props.payrateFrequency.name || '',
    };
  }
});
</script>

<style scoped>
.edit-payrate-frequency-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-payrate-frequency-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
