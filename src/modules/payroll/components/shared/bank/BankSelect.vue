<template>
  <div>
    <q-select
      v-model="selectedBankId"
      :options="bankOptionsList"
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
      :loading="isLoadingBanks"
      @filter="filterBanks"
    >
      <template v-if="isLoadingBanks" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddBankDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Bank</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name || scope.opt.id }}</q-item-label>
            <q-item-label v-if="scope.opt.code" caption class="text-grey-6">
              ─ {{ scope.opt.code }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="crudFlags.showEdit && !readonly" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditBankDialog(scope.opt as Bank)"
            >
              <q-tooltip>Edit Bank</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddBank
      v-model="showAddDialog"
      @saved="onBankSaved"
    />
    <EditBank
      v-model="showEditDialog"
      :bank="selectedBank"
      @updated="onBankUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import { useCrudPermission } from '@core/composables/useCrudPermission';
import type { Bank } from '@core/types/models';
import AddBank from './AddBank.vue';
import EditBank from './EditBank.vue';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
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
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Bank',
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const authStore = useAuthStore();
const { withCrudFlags } = useCrudPermission('bank');
const crudFlags = withCrudFlags(props);
const banks = ref<Bank[]>([]);
const isLoadingBanks = ref(false);
const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const selectedBank = ref<Bank | null>(null);

// Use a ref for options list to avoid computed property re-renders
const bankOptionsList = ref<(Bank | { id: string; name: string })[]>([]);

// Function to build options list
const buildOptionsList = (banksList: Bank[]) => {
  const options: (Bank | { id: string; name: string })[] = [...banksList];
  if (crudFlags.showAddNew.value && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Bank' });
  }
  return options;
};

const filterBanks = (val: string, update: (callback: () => void) => void) => {
  const searchTerm = val?.toLowerCase().trim() || '';

  update(() => {
    let filtered: Bank[];
    if (!searchTerm) {
      filtered = banks.value;
    } else {
      filtered = banks.value.filter((bank: Bank) =>
        bank.name?.toLowerCase().includes(searchTerm) ||
        bank.code?.toLowerCase().includes(searchTerm)
      );
    }
    bankOptionsList.value = buildOptionsList(filtered);
  });
};

const fetchBanks = async (search?: string) => {
  if (isLoadingBanks.value) return;

  isLoadingBanks.value = true;
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    const queryParams = new URLSearchParams();
    if (search) {
      queryParams.append('search', search);
    }

    const response = await fetch(`${API_URL}/banks?${queryParams.toString()}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch banks: ${response.statusText}`);
    }

    const data = await response.json();
    const allBanks = Array.isArray(data) ? data : (data.data || []);
    
    // Update banks list
    banks.value = allBanks;
    // Update options list
    bankOptionsList.value = buildOptionsList(allBanks);
  } catch (error) {
    console.error('Error fetching banks:', error);
    banks.value = [];
    bankOptionsList.value = buildOptionsList([]);
  } finally {
    isLoadingBanks.value = false;
  }
};

const selectedBankId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddBankDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddBankDialog = () => {
  showAddDialog.value = true;
};

const openEditBankDialog = (bank: Bank) => {
  selectedBank.value = bank;
  showEditDialog.value = true;
};

const onBankSaved = async (bankId: string) => {
  // Refresh banks to include the newly created one
  await fetchBanks();
  // Select the newly created bank
  emit('update:modelValue', bankId);
  emit('change', bankId);
};

const onBankUpdated = async () => {
  // Refresh banks after update
  await fetchBanks();
};

onMounted(async () => {
  if (banks.value.length === 0) {
    await fetchBanks();
  }
  bankOptionsList.value = buildOptionsList(banks.value);
});
</script>

<style scoped>
</style>

