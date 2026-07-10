<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-account-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Account</div>
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
            :disable="accountStore.isLoading"
          />

          <q-input
            v-model="form.description"
            label="Description *"
            type="textarea"
            outlined
            rows="2"
            maxlength="255"
            counter
            :rules="[val => !!val || 'Description is required']"
            :disable="accountStore.isLoading"
          />

          <div class="row q-gutter-md">
            <q-input
              v-model="form.code1"
              label="Code 1 *"
              outlined
              maxlength="24"
              counter
              :rules="[val => !!val || 'Code 1 is required']"
              :disable="accountStore.isLoading"
              class="col"
            />
            <q-input
              v-model="form.code2"
              label="Code 2"
              outlined
              maxlength="24"
              counter
              :disable="accountStore.isLoading"
              class="col"
            />
          </div>

          <q-input
            v-model.number="form.balance"
            label="Balance *"
            type="number"
            step="0.01"
            outlined
            :rules="[val => val !== null && val !== undefined || 'Balance is required']"
            :disable="accountStore.isLoading"
          />

          <AccountTypeSelect
            v-model="form.account_type_id"
            :rules="[(val: number | null | undefined) => val !== null && val !== undefined || 'Account type is required']"
            :disable="accountStore.isLoading"
            :showAddNew="true"
          />

          <q-select
            v-model="form.parent_id"
            :options="parentAccountOptions"
            option-value="id"
            option-label="name"
            emit-value
            map-options
            label="Parent Account"
            outlined
            clearable
            :disable="accountStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="accountStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="accountStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useAccountStore } from '../../../stores/account-store';
import { useAuthStore } from '../../../stores/auth';
import type { Account } from '../../models';
import AccountTypeSelect from '../../account-type/AccountTypeSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  account: Account | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  account: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [accountId: string];
}>();

const accountStore = useAccountStore();
const authStore = useAuthStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  description: null as string | null,
  code1: null as string | null,
  code2: null as string | null,
  balance: 0 as number,
  parent_id: null as string | null,
  account_type_id: null as number | null,
});

const parentAccountOptions = ref<Array<{ id: string; name: string }>>([]);

const fetchParentAccounts = async () => {
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/accounts?per_page=100`, {
      headers,
    });

    if (response.ok) {
      const data = await response.json();
      const accounts = data.data || data;
      parentAccountOptions.value = accounts
        .filter((acc: Account) => acc.id !== props.account?.id) // Exclude current account
        .map((acc: Account) => ({
          id: acc.id,
          name: acc.name,
        }));
    }
  } catch (error) {
    console.error('Error fetching parent accounts:', error);
  }
};

const onSubmit = async () => {
  if (!form.value.name || !form.value.description || !form.value.code1 || form.value.balance === null || form.value.balance === undefined || !form.value.account_type_id || !props.account) {
    return;
  }

  try {
    const updatedAccount = await accountStore.updateAccount(
      props.account.id,
      form.value.name,
      form.value.description,
      form.value.code1,
      form.value.code2,
      form.value.balance,
      form.value.parent_id,
      form.value.account_type_id
    );

    if (updatedAccount) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Account updated successfully!',
      });
      emit('updated', updatedAccount.id);
      onClose();
    } else if (accountStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: accountStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update account';
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

// Load account data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.account) {
    // Populate form with existing data
    form.value = {
      name: props.account.name || '',
      description: props.account.description ?? null,
      code1: props.account.code1 ?? null,
      code2: props.account.code2 ?? null,
      balance: props.account.balance ?? 0,
      parent_id: props.account.parent_id ?? null,
      account_type_id: props.account.account_type_id ?? null,
    };
    await fetchParentAccounts();
  }
});

onMounted(async () => {
  await fetchParentAccounts();
});
</script>

<style scoped>
.edit-account-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-account-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

