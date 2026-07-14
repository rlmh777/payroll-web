<template>
  <div>
    <q-select
      v-model="selectedVendorId"
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
      :loading="isLoadingVendors"
      @filter="filterVendors"
    >
      <template v-if="isLoadingVendors" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddVendorDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Vendor/Creditor</q-item-label>
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
              @click.stop="openEditVendorDialog(scope.opt as Vendor)"
            >
              <q-tooltip>Edit Vendor/Creditor</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddVendor
      v-model="showAddDialog"
      @saved="onVendorSaved"
    />
    <EditVendor
      v-model="showEditDialog"
      :vendor="selectedVendor"
      @updated="onVendorUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import type { Vendor } from '@core/types/models';
import AddVendor from '@payroll/components/shared/vendor/AddVendor.vue';
import EditVendor from '@payroll/components/shared/vendor/EditVendor.vue';

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
  label: 'Vendor/Creditor',
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const authStore = useAuthStore();
const vendors = ref<Vendor[]>([]);
const isLoadingVendors = ref(false);
const options = ref<(Vendor | { id: string; name: string })[]>([]);
const showAddDialog = ref<boolean>(false);
const showEditDialog = ref<boolean>(false);
const selectedVendor = ref<Vendor | null>(null);

function buildOptions(items: Vendor[], search = '') {
  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? items.filter((vendor) => (vendor.name || '').toLowerCase().includes(needle))
    : [...items];
  const list: (Vendor | { id: string; name: string })[] = filtered;
  if (props.showAddNew && !props.readonly) {
    list.unshift({ id: 'add-new', name: 'Add New Vendor' });
  }
  return list;
}

function syncOptions(search = '') {
  options.value = buildOptions(vendors.value, search);
}

const filterVendors = (val: string, update: (callback: () => void) => void) => {
  update(() => {
    syncOptions(val || '');
  });
};

const fetchVendors = async () => {
  if (isLoadingVendors.value) return;

  isLoadingVendors.value = true;
  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (authStore.token) {
      headers['Authorization'] = `Bearer ${authStore.token}`;
    }

    try {
      const response = await fetch(`${API_URL}/vendors`, { headers });

      if (!response.ok) {
        if (response.status === 404) {
          vendors.value = [];
          return;
        }
        throw new Error(`Failed to fetch vendors: ${response.statusText}`);
      }

      const data = await response.json();
      vendors.value = data.data || data || [];
    } catch (error) {
      console.warn('Vendor API endpoint may not be available:', error);
      vendors.value = [];
    }
  } catch (error) {
    console.error('Error fetching vendors:', error);
    vendors.value = [];
  } finally {
    isLoadingVendors.value = false;
  }
};

const selectedVendorId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    if (value === 'add-new') {
      openAddVendorDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddVendorDialog = () => {
  showAddDialog.value = true;
};

const openEditVendorDialog = (vendor: Vendor) => {
  selectedVendor.value = vendor;
  showEditDialog.value = true;
};

const onVendorSaved = async (vendorId: string) => {
  await fetchVendors();
  syncOptions();
  emit('update:modelValue', vendorId);
  emit('change', vendorId);
};

const onVendorUpdated = async () => {
  await fetchVendors();
  syncOptions();
};

onMounted(async () => {
  if (vendors.value.length === 0) {
    await fetchVendors();
  }
  syncOptions();
});
</script>

<style scoped>
</style>

