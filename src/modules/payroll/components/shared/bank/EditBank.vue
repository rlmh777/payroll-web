<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-bank-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Bank</div>
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
            :disable="bankStore.isLoading"
          />

          <q-input
            v-model="form.code"
            label="Code"
            outlined
            maxlength="255"
            counter
            :disable="bankStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="bankStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="bankStore.isLoading"
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
import { useBankStore } from '@core/stores/bank-store';
import type { Bank } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  bank: Bank | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  bank: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [bankId: string];
}>();

const bankStore = useBankStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  code: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name || !props.bank) {
    return;
  }

  try {
    const updatedBank = await bankStore.updateBank(
      props.bank.id,
      form.value.name,
      form.value.code || null
    );

    if (updatedBank) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Bank updated successfully!',
      });
      emit('updated', updatedBank.id);
      onClose();
    } else if (bankStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: bankStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update bank';
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

// Load bank data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.bank) {
    // Populate form with existing data
    form.value = {
      name: props.bank.name || '',
      code: props.bank.code || null,
    };
  }
});
</script>

<style scoped>
.edit-bank-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-bank-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

