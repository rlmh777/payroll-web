<template>
  <div>
    <q-select
      v-model="selectedAccountId"
      :options="options"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      :clearable="clearable"
      :label="label"
      :loading="employeeStore.isLoadingAccounts"
      @filter="filterAccounts"
    >
      <template v-if="employeeStore.isLoadingAccounts" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddAccountDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Account</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.accountType?.name" caption class="text-grey-6">
              ─ {{ scope.opt.accountType.name }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditAccountDialog(scope.opt as Account)"
            >
              <q-tooltip>Edit Account</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddAccount
      v-model="showAddDialog"
      @saved="onAccountSaved"
    />
    <EditAccount
      v-model="showEditDialog"
      :account="selectedAccount"
      @updated="onAccountUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeStore } from '@hr/stores/employee-store';
import type { Account } from '@core/types/models';
import AddAccount from '@payroll/components/settings/account/AddAccount.vue';
import EditAccount from '@payroll/components/settings/account/EditAccount.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeAccount?: string | null;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
  showEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeAccount: null,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Account',
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const selectedAccount = ref<Account | null>(null);
const options = ref<(Account | { id: string; name: string })[]>([]);

function buildOptions(items: Account[], search = '') {
  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? items.filter((account) => (account.name || '').toLowerCase().includes(needle))
    : [...items];
  const list: (Account | { id: string; name: string })[] = filtered;
  if (props.showAddNew && !props.readonly && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Account' });
  }
  return list;
}

function syncOptions(search = '') {
  options.value = buildOptions(employeeStore.accounts, search);
}

const filterAccounts = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    syncOptions(val || '');
  });
};

const selectedAccountId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddAccountDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddAccountDialog = () => {
  showAddDialog.value = true;
};

const openEditAccountDialog = (account: Account) => {
  selectedAccount.value = account;
  showEditDialog.value = true;
};

const onAccountSaved = async (accountId: string) => {
  await employeeStore.fetchAccounts();
  syncOptions();
  emit('update:modelValue', accountId);
  emit('change', accountId);
};

const onAccountUpdated = async () => {
  await employeeStore.fetchAccounts();
  syncOptions();
};

onMounted(async () => {
  if (employeeStore.accounts.length === 0) {
    await employeeStore.fetchAccounts();
  }
  syncOptions();
});
</script>

<style scoped>
</style>

