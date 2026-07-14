<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-account-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Account</div>
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
            :showEdit="true"
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
              label="Save"
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
import { useAccountStore } from '@payroll/stores/account-store';
import { useAuthStore } from '@core/stores/auth';
import AccountTypeSelect from '@payroll/components/shared/account-type/AccountTypeSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [accountId: string];
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
      parentAccountOptions.value = accounts.map((acc: { id: string; name: string }) => ({
        id: acc.id,
        name: acc.name,
      }));
    }
  } catch (error) {
    console.error('Error fetching parent accounts:', error);
  }
};

const onSubmit = async () => {
  if (!form.value.name || !form.value.description || !form.value.code1 || form.value.balance === null || form.value.balance === undefined || !form.value.account_type_id) {
    return;
  }

  try {
    const newAccount = await accountStore.createAccount(
      form.value.name,
      form.value.description,
      form.value.code1,
      form.value.code2,
      form.value.balance,
      form.value.parent_id,
      form.value.account_type_id
    );

    if (newAccount) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Account created successfully!',
      });
      emit('saved', newAccount.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to create account';
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
    description: null,
    code1: null,
    code2: null,
    balance: 0,
    parent_id: null,
    account_type_id: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      description: null,
      code1: null,
      code2: null,
      balance: 0,
      parent_id: null,
      account_type_id: null,
    };
    await fetchParentAccounts();
  }
});

onMounted(async () => {
  await fetchParentAccounts();
});
</script>

<style scoped>
.add-account-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-account-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

