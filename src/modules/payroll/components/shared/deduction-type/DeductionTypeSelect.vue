<template>
  <div>
    <q-select
      v-model="selectedDeductionTypeId"
      :options="deductionTypeOptions"
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
      :loading="isLoadingDeductionTypes"
      @filter="filterDeductionTypes"
    >
      <template v-if="isLoadingDeductionTypes" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddDeductionTypeDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Deduction Type</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.defaultAmount" caption class="text-grey-6">
              ─ Default: {{ formatCurrency(scope.opt.defaultAmount) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddDeductionType
      v-model="showAddDialog"
      @saved="onDeductionTypeSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDeductionTypeStore } from '@payroll/stores/deduction-type-store';
import type { DeductionType } from '@core/types/models';
import AddDeductionType from './AddDeductionType.vue';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Deduction Type',
  showAddNew: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const deductionTypeStore = useDeductionTypeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref<boolean>(false);

const isLoadingDeductionTypes = computed(() => deductionTypeStore.isLoadingDeductionTypes);

const deductionTypeOptions = computed((): (DeductionType | { id: number | string; name: string; defaultAmount?: number })[] => {
  const options: (DeductionType | { id: number | string; name: string; defaultAmount?: number })[] = [...deductionTypeStore.deductionTypes];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Deduction Type' });
  }
  return options;
});

const filterDeductionTypes = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all deduction types without fetching
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
    void deductionTypeStore.fetchDeductionTypes(undefined, undefined, val);
  }, 300);
};

const selectedDeductionTypeId = computed({
  get: (): number | null => {
    return props.modelValue || null;
  },
  set: (value: number | string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddDeductionTypeDialog();
      return;
    }
    // Convert to number if it's a valid number
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (isNaN(numValue as number)) {
      return;
    }
    emit('update:modelValue', numValue);
    emit('change', numValue);
  },
});

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openAddDeductionTypeDialog = () => {
  showAddDialog.value = true;
};

const onDeductionTypeSaved = async (deductionTypeId: number) => {
  // Refresh deduction types to include the newly created one
  await deductionTypeStore.fetchDeductionTypes();
  // Select the newly created deduction type
  emit('update:modelValue', deductionTypeId);
  emit('change', deductionTypeId);
};

// Fetch deduction types on mount if not already loaded
onMounted(async () => {
  if (deductionTypeStore.deductionTypes.length === 0) {
    await deductionTypeStore.fetchDeductionTypes();
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

