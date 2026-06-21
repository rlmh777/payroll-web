<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-relief-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Personal Relief</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model.number="form.startRange"
            label="Start Range *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Start range is required']"
            :disable="personalReliefStore.isLoading"
          />

          <q-input
            v-model.number="form.endRange"
            label="End Range *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[
              val => val !== null && val !== undefined && val >= 0 || 'End range is required',
              val => form.startRange === null || val >= form.startRange || 'End range must be greater than or equal to start range'
            ]"
            :disable="personalReliefStore.isLoading"
          />

          <q-input
            v-model.number="form.personalRelief"
            label="Personal Relief *"
            type="number"
            step="0.01"
            min="0"
            outlined
            :rules="[val => val !== null && val !== undefined && val >= 0 || 'Personal relief is required']"
            :disable="personalReliefStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="personalReliefStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="personalReliefStore.isLoading"
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
import { usePersonalReliefStore } from '../../../stores/personal-relief-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [recordId: string];
}>();

const personalReliefStore = usePersonalReliefStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  startRange: null as number | null,
  endRange: null as number | null,
  personalRelief: null as number | null,
});

const onSubmit = async () => {
  if (
    form.value.startRange === null ||
    form.value.endRange === null ||
    form.value.personalRelief === null
  ) {
    return;
  }

  try {
    const newRecord = await personalReliefStore.createPersonalRelief(
      form.value.startRange,
      form.value.endRange,
      form.value.personalRelief
    );

    if (newRecord) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Personal relief record created successfully!',
      });
      emit('saved', newRecord.id);
      onClose();
    } else if (personalReliefStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: personalReliefStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create personal relief record';
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
    startRange: null,
    endRange: null,
    personalRelief: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      startRange: null,
      endRange: null,
      personalRelief: null,
    };
  }
});
</script>

<style scoped>
.add-relief-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-relief-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

