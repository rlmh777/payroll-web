<template>
  <div>
    <q-select
      v-model="selectedFrequencyId"
      :options="frequencyOptionsList"
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
      :loading="payrateFrequencyStore.isLoadingPayrateFrequencies"
      @filter="filterFrequencies"
    >
      <template v-if="payrateFrequencyStore.isLoadingPayrateFrequencies" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-if="showEdit && !readonly && selectedFrequencyId" #append>
        <q-btn
          flat
          round
          dense
          icon="edit"
          color="primary"
          size="sm"
          :disable="disable"
          @click.stop="openEditSelectedFrequency"
        >
          <q-tooltip>Edit Pay Rate Frequency</q-tooltip>
        </q-btn>
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddPayrateFrequencyDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Pay Rate Frequency</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name || scope.opt.id }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditPayrateFrequencyDialog(scope.opt as PayrateFrequency)"
            >
              <q-tooltip>Edit Pay Rate Frequency</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddPayrateFrequency
      v-model="showAddDialog"
      @saved="onPayrateFrequencySaved"
    />
    <EditPayrateFrequency
      v-model="showEditDialog"
      :payrateFrequency="selectedPayrateFrequency"
      @updated="onPayrateFrequencyUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { usePayrateFrequencyStore } from '@/stores/payrate-frequency-store';
import type { PayrateFrequency } from '@core/types/models';
import AddPayrateFrequency from '@payroll/components/shared/payrate-frequency/AddPayrateFrequency.vue';
import EditPayrateFrequency from '@payroll/components/shared/payrate-frequency/EditPayrateFrequency.vue';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeFrequency?: string | null;
  disable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
  showEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeFrequency: null,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Pay Rate Frequency',
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const payrateFrequencyStore = usePayrateFrequencyStore();

const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedPayrateFrequency = ref<PayrateFrequency | null>(null);
const frequencyOptionsList = ref<(PayrateFrequency | { id: number | string; name: string })[]>([]);

const buildOptionsList = (frequencies: PayrateFrequency[]) => {
  const options: (PayrateFrequency | { id: number | string; name: string })[] = [...frequencies];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Pay Rate Frequency' });
  }
  return options;
};

const filterFrequencies = (val: string, update: (callback: () => void) => void) => {
  const searchTerm = val?.trim() || '';

  update(() => {
    let filtered: PayrateFrequency[];
    if (!searchTerm) {
      filtered = payrateFrequencyStore.payrateFrequencies;
    } else {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = payrateFrequencyStore.payrateFrequencies.filter((frequency) =>
        frequency.name?.toLowerCase().includes(lowerSearch)
      );
    }
    frequencyOptionsList.value = buildOptionsList(filtered);
  });
};

const selectedFrequencyId = computed({
  get: (): number | null => {
    return props.modelValue ?? null;
  },
  set: (value: number | string | null) => {
    if (value === 'add-new') {
      openAddPayrateFrequencyDialog();
      return;
    }
    const numValue = typeof value === 'string' ? parseInt(value, 10) : value;
    if (numValue === null || Number.isNaN(numValue)) {
      return;
    }
    emit('update:modelValue', numValue);
    emit('change', numValue);
  },
});

const openAddPayrateFrequencyDialog = () => {
  showAddDialog.value = true;
};

const openEditPayrateFrequencyDialog = (payrateFrequency: PayrateFrequency) => {
  selectedPayrateFrequency.value = payrateFrequency;
  showEditDialog.value = true;
};

const openEditSelectedFrequency = () => {
  if (!selectedFrequencyId.value) {
    return;
  }
  const frequency = payrateFrequencyStore.payrateFrequencies.find(
    (item) => item.id === selectedFrequencyId.value
  );
  if (frequency) {
    openEditPayrateFrequencyDialog(frequency);
  }
};

const onPayrateFrequencySaved = async (payrateFrequencyId: number) => {
  await payrateFrequencyStore.fetchPayrateFrequencies();
  await nextTick();
  frequencyOptionsList.value = buildOptionsList(payrateFrequencyStore.payrateFrequencies);
  emit('update:modelValue', payrateFrequencyId);
  emit('change', payrateFrequencyId);
};

const onPayrateFrequencyUpdated = async () => {
  await payrateFrequencyStore.fetchPayrateFrequencies();
  frequencyOptionsList.value = buildOptionsList(payrateFrequencyStore.payrateFrequencies);
};

watch(
  () => payrateFrequencyStore.payrateFrequencies,
  (frequencies) => {
    frequencyOptionsList.value = buildOptionsList(frequencies);
  },
  { deep: true }
);

onMounted(async () => {
  if (payrateFrequencyStore.payrateFrequencies.length === 0) {
    await payrateFrequencyStore.fetchPayrateFrequencies();
  }
  frequencyOptionsList.value = buildOptionsList(payrateFrequencyStore.payrateFrequencies);
});
</script>

<style scoped>
</style>
