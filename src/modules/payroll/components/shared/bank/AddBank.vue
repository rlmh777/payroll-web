<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-bank-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Bank</div>
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
              label="Save"
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

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [bankId: string];
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
  if (!form.value.name) {
    return;
  }

  try {
    const newBank = await bankStore.createBank(
      form.value.name,
      form.value.code || null
    );

    if (newBank) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Bank created successfully!',
      });
      emit('saved', newBank.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create bank';
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
    code: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      code: null,
    };
  }
});
</script>

<style scoped>
.add-bank-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-bank-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

