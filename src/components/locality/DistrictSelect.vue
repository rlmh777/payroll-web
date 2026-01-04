<template>
  <div>
    <q-select
      v-model="selectedDistrictId"
      :options="districtOptions"
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
      label="District"
      :loading="districtStore.isLoadingDistricts"
      @filter="filterDistricts"
    >
      <template v-if="districtStore.isLoadingDistricts" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddDistrictDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New District</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.country?.name" caption class="text-grey-6">
              ─ {{ scope.opt.country.name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddDistrict v-model="showAddDialog" @saved="onDistrictSaved" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useDistrictStore, type District } from '../../stores/district-store';
import AddDistrict from '../district/AddDistrict.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeDistrict?: string | null;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  showAddNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeDistrict: null,
  disable: false,
  rules: () => [],
  showAddNew: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  change: [value: string | null];
}>();

const districtStore = useDistrictStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref(false);

const districtOptions = computed((): (District | { id: string; name: string })[] => {
  const options = [...districtStore.districts];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New District' });
  }
  return options;
});

const filterDistricts = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all districts without fetching
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
    void districtStore.fetchDistricts({ search: val });
  }, 300);
};

const selectedDistrictId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddDistrictDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddDistrictDialog = () => {
  showAddDialog.value = true;
};

const onDistrictSaved = async (districtId: string) => {
  // Refresh districts list
  await districtStore.fetchDistricts({ search: props?.employeeDistrict || '' });
  // Set the newly created district as selected
  emit('update:modelValue', districtId);
  emit('change', districtId);
};

// Fetch districts on mount if not already loaded
onMounted(async () => {
  await districtStore.fetchDistricts({ countryId: props?.employeeDistrict || '' });
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped></style>
