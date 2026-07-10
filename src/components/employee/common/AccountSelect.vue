<template>
  <div>
    <q-select
      v-model="selectedAccountId"
      :options="accountOptions"
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Account } from '../../models';
import AddAccount from '../../settings/account/AddAccount.vue';
import EditAccount from '../../settings/account/EditAccount.vue';

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

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const selectedAccount = ref<Account | null>(null);

const accountOptions = computed((): (Account | { id: string; name: string })[] => {
  const options: (Account | { id: string; name: string })[] = [...employeeStore.accounts];
  if (props.showAddNew && !props.readonly && !props.disable) {
    options.unshift({ id: 'add-new', name: 'Add New Account' });
  }
  return options;
});

const filterAccounts = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all accounts without fetching
  if (!val || val.trim() === '') {
    update(() => {
      // Keep current options - no need to refetch
    });
    return;
  }

  // Call update immediately to show we're handling it
  update(() => {
    // Keep current options while fetching
  });

  // Debounce API calls - wait 300ms after user stops typing
  filterTimeout.value = setTimeout(() => {
    void employeeStore.fetchAccounts(val);
  }, 300);
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
  // Refresh accounts to include the newly created one
  await employeeStore.fetchAccounts();
  // Select the newly created account
  emit('update:modelValue', accountId);
  emit('change', accountId);
};

const onAccountUpdated = async () => {
  // Refresh accounts after update
  await employeeStore.fetchAccounts();
};

// Fetch accounts on mount if not already loaded
onMounted(async () => {
  if (employeeStore.accounts.length === 0) {
    await employeeStore.fetchAccounts();
  }
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped>
</style>

