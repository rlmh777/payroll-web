<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-account-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Account Type</div>
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
              label="Update"
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
import { useAccountTypeStore } from '@payroll/stores/account-type-store';
import type { AccountType } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  accountType: AccountType | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  accountType: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [accountTypeId: number];
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
  if (!form.value.name || !props.accountType) {
    return;
  }

  try {
    const updatedAccountType = await accountTypeStore.updateAccountType(
      props.accountType.id,
      form.value.name,
      form.value.normal_balance,
      form.value.statement
    );

    if (updatedAccountType) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Account type updated successfully!',
      });
      emit('updated', updatedAccountType.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update account type';
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

// Load account type data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.accountType) {
    // Populate form with existing data
    form.value = {
      name: props.accountType.name || '',
      normal_balance: props.accountType.normal_balance ?? null,
      statement: props.accountType.statement ?? null,
    };
  }
});
</script>

<style scoped>
.edit-account-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-account-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

