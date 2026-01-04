<template>
  <div>
    <q-select
      v-model="selectedAllowanceId"
      :options="allowanceOptions"
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
      :loading="employeeStore.isLoadingAllowances"
      @filter="filterAllowances"
    >
      <template v-if="employeeStore.isLoadingAllowances" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddAllowanceDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Allowance</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.defaultAmount" caption class="text-grey-6">
              ─ Default: {{ formatCurrency(scope.opt.defaultAmount) }}
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
              @click.stop="openEditAllowanceDialog(scope.opt as Allowance)"
            >
              <q-tooltip>Edit Allowance</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddAllowance
      v-model="showAddDialog"
      @saved="onAllowanceSaved"
    />
    <EditAllowance
      v-model="showEditDialog"
      :allowance="selectedAllowance"
      @updated="onAllowanceUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../stores/employee-store';
import type { Allowance } from '../models';
import AddAllowance from './AddAllowance.vue';
import EditAllowance from './EditAllowance.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeAllowance?: string | null;
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
  employeeAllowance: null,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Allowance',
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
const selectedAllowance = ref<Allowance | null>(null);

const allowanceOptions = computed((): (Allowance | { id: string; name: string; defaultAmount?: number })[] => {
  const options: (Allowance | { id: string; name: string; defaultAmount?: number })[] = [...employeeStore.allowances];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Allowance' });
  }
  return options;
});

const filterAllowances = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all allowances without fetching
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
    void employeeStore.fetchAllowances(val);
  }, 300);
};

const selectedAllowanceId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddAllowanceDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openAddAllowanceDialog = () => {
  showAddDialog.value = true;
};

const openEditAllowanceDialog = (allowance: Allowance) => {
  selectedAllowance.value = allowance;
  showEditDialog.value = true;
};

const onAllowanceSaved = async (allowanceId: string) => {
  // Refresh allowances to include the newly created one
  await employeeStore.fetchAllowances();
  // Select the newly created allowance
  emit('update:modelValue', allowanceId);
  emit('change', allowanceId);
};

const onAllowanceUpdated = async () => {
  // Refresh allowances after update
  await employeeStore.fetchAllowances();
};

// Fetch allowances on mount if not already loaded
onMounted(async () => {
  if (employeeStore.allowances.length === 0) {
    await employeeStore.fetchAllowances();
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

