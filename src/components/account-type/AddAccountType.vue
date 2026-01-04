<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-account-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Account Type</div>
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
            :disable="accountTypeStore.isLoading"
          />

          <q-input
            v-model="form.normal_balance"
            label="Normal Balance"
            outlined
            :disable="accountTypeStore.isLoading"
          />

          <q-select
            v-model="form.statement"
            :options="statementOptions"
            label="Statement"
            outlined
            clearable
            :disable="accountTypeStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="accountTypeStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="accountTypeStore.isLoading"
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
import { useAccountTypeStore } from '../../stores/account-type-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [accountTypeId: number];
}>();

const accountTypeStore = useAccountTypeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  normal_balance: null as string | null,
  statement: null as string | null,
});

const statementOptions = [
  'Balance Sheet',
  'Income Statement',
];

const onSubmit = async () => {
  if (!form.value.name) {
    return;
  }

  try {
    const newAccountType = await accountTypeStore.createAccountType(
      form.value.name,
      form.value.normal_balance,
      form.value.statement
    );

    if (newAccountType) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Account type created successfully!',
      });
      emit('saved', newAccountType.id);
      onClose();
    } else if (accountTypeStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: accountTypeStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account type';
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
    normal_balance: null,
    statement: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      normal_balance: null,
      statement: null,
    };
  }
});
</script>

<style scoped>
.add-account-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-account-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

