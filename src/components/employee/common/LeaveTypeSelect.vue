<template>
  <q-select
    v-model="selectedLeaveTypeId"
    :options="leaveTypeOptions"
    option-value="id"
    option-label="name"
    use-input
    fill-input
    hide-selected
    emit-value
    map-options
    clearable
    outlined
    dense
    :readonly="readonly"
    label="Leave Type"
    :loading="employeeStore.isLoadingLeaveTypes"
    @filter="filterLeaveTypes"
  >
    <template v-if="employeeStore.isLoadingLeaveTypes" v-slot:prepend>
      <q-spinner color="primary" size="20px" />
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useEmployeeStore } from '../../../stores/employee-store';
import type { LeaveType } from '../../models';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  employeeLeaveType?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  employeeLeaveType: null as number | null,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const employeeStore = useEmployeeStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const lastSearchTerm = ref<string>('');

const leaveTypeOptions = computed((): LeaveType[] => {
  return employeeStore.leaveTypes;
});

const filterLeaveTypes = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // Call update immediately to show that we're handling the filter
  // This is required for Quasar to know the filter is being processed
  update(() => {
    // Options will be filtered by the computed property reactively
  });

  // Only fetch if the search term actually changed and user is typing
  const searchTerm = val || '';
  if (searchTerm === lastSearchTerm.value) {
    // Same search term, no need to fetch again
    return;
  }

  lastSearchTerm.value = searchTerm;

  // Debounce API calls - wait 300ms after user stops typing
  // Only fetch if user is actually typing (val is not empty)
  if (searchTerm.length > 0) {
    filterTimeout.value = setTimeout(() => {
      // Only fetch if not already loading to prevent flickering
      if (!employeeStore.isLoadingLeaveTypes && searchTerm === lastSearchTerm.value) {
        void employeeStore.fetchLeaveTypes(searchTerm);
      }
    }, 300);
  } else {
    // If search is cleared, reset to all options without fetching
    // Only fetch all if we don't already have them
    if (employeeStore.leaveTypes.length === 0 && !employeeStore.isLoadingLeaveTypes) {
      filterTimeout.value = setTimeout(() => {
        void employeeStore.fetchLeaveTypes('');
      }, 300);
    }
  }
};

const selectedLeaveTypeId = computed({
  get: (): number | null => {
    return props.modelValue;
  },
  set: (value: number | null) => {
    emit('update:modelValue', value);
    emit('change', value);
  },
});

// Fetch leave types on mount if not already loaded
onMounted(async () => {
  // Only fetch if leave types are not already loaded
  if (employeeStore.leaveTypes.length === 0) {
    await employeeStore.fetchLeaveTypes();
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

