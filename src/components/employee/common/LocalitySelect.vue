<template>
  <div>
    <q-select
      v-model="selectedLocalityId"
      :options="localityOptions"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      :readonly="readonly"
      label="Locality"
      :loading="employeeStore.isLoadingLocalities"
      @filter="filterLocalities"
    >
      <template v-if="employeeStore.isLoadingLocalities" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddLocalityDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Location</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label
              v-if="scope.opt.district?.name || scope.opt.district?.country?.name"
              caption
              class="text-grey-6"
            >
              <span v-if="scope.opt.district?.name">─ {{ scope.opt.district.name }}</span>
              <span v-if="scope.opt.district?.name && scope.opt.district?.country?.name"> • </span>
              <span v-if="scope.opt.district?.country?.name">{{ scope.opt.district.country.name }}</span>
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddLocality
      v-model="showAddDialog"
      @saved="onLocalitySaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { Locality } from '../../models';
import AddLocality from '../../locality/AddLocality.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  employeeLocality?: string | null;
  showAddNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeLocality: null,
  showAddNew: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const employeeStore = useEmployeeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref(false);

const localityOptions = computed((): (Locality | { id: string; name: string })[] => {
  const options = [...employeeStore.localities];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Location' });
  }
  return options;
});

const filterLocalities = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // Call update immediately to show that we're handling the filter
  // This is required for Quasar to know the filter is being processed
  update(() => {
    // For now, keep current options while we fetch new ones
    // The options will update reactively when the API call completes
  });

  // Debounce API calls - wait 300ms after user stops typing
  filterTimeout.value = setTimeout(() => {
    // Call async function without awaiting - the callback must be synchronous
    void employeeStore.fetchLocalities(val || '');
  }, 300);
};

const selectedLocalityId = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddLocalityDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddLocalityDialog = () => {
  showAddDialog.value = true;
};

const onLocalitySaved = async (localityId: string) => {
  // Refresh localities list
  await employeeStore.fetchLocalities(props?.employeeLocality || '');
  // Set the newly created locality as selected
  emit('update:modelValue', localityId);
  emit('change', localityId);
};

// Fetch localities on mount if not already loaded
onMounted(async () => {
  await employeeStore.fetchLocalities(props?.employeeLocality || '');
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

