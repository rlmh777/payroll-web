<template>
  <div>
    <q-select
      v-model="selectedAccountTypeId"
      :options="accountTypeOptions"
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
      label="Account Type"
      :loading="isLoadingAccountTypes"
      @filter="filterAccountTypes"
    >
      <template v-if="isLoadingAccountTypes" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddAccountTypeDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Account Type</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.statement" caption class="text-grey-6">
              ─ {{ scope.opt.statement }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditAccountTypeDialog(scope.opt as AccountType)"
            >
              <q-tooltip>Edit Account Type</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddAccountType
      v-model="showAddDialog"
      @saved="onAccountTypeSaved"
    />
    <EditAccountType
      v-model="showEditDialog"
      :accountType="selectedAccountType"
      @updated="onAccountTypeUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useAccountTypeStore } from '@payroll/stores/account-type-store';
import type { AccountType } from '@core/types/models';
import AddAccountType from './AddAccountType.vue';
import EditAccountType from './EditAccountType.vue';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
  showAddNew?: boolean;
  showEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const accountTypeStore = useAccountTypeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const selectedAccountType = ref<AccountType | null>(null);

const isLoadingAccountTypes = computed(() => accountTypeStore.isLoadingAccountTypes);

const accountTypeOptions = computed((): (AccountType | { id: string | number; name: string })[] => {
  const options: (AccountType | { id: string | number; name: string })[] = [...accountTypeStore.accountTypes];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Account Type' });
  }
  return options;
});

const filterAccountTypes = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all account types without fetching
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
    accountTypeStore.searchFilters.search = val;
    void accountTypeStore.fetchAccountTypes();
  }, 300);
};

const selectedAccountTypeId = computed({
  get: (): number | null => {
    return props.modelValue || null;
  },
  set: (value: number | string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddAccountTypeDialog();
      return;
    }
    emit('update:modelValue', value as number | null);
    emit('change', value as number | null);
  },
});

const openAddAccountTypeDialog = () => {
  showAddDialog.value = true;
};

const openEditAccountTypeDialog = (accountType: AccountType) => {
  selectedAccountType.value = accountType;
  showEditDialog.value = true;
};

const onAccountTypeSaved = async (accountTypeId: number) => {
  // Refresh account types to include the newly created one
  await accountTypeStore.fetchAccountTypes();
  // Select the newly created account type
  emit('update:modelValue', accountTypeId);
  emit('change', accountTypeId);
};

const onAccountTypeUpdated = async () => {
  // Refresh account types after update
  await accountTypeStore.fetchAccountTypes();
};

// Fetch account types on mount if not already loaded
onMounted(async () => {
  if (accountTypeStore.accountTypes.length === 0) {
    await accountTypeStore.fetchAccountTypes();
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

