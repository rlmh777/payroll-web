<template>
  <div >
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-2">
        <LeaveTypeSelect
          v-model="searchFilters.leaveTypeId"
          label="Filter by Leave Type"
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-input
          v-model="startDateInput"
          label="Start Date"
          type="date"
          outlined
          dense
          clearable
          @update:model-value="onSearch"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="startDateQDate" @update:model-value="onSearch">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-2">
        <q-input
          v-model="endDateInput"
          label="End Date"
          type="date"
          outlined
          dense
          clearable
          @update:model-value="onSearch"
        >
          <template v-slot:append>
            <q-icon name="event" class="cursor-pointer">
              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                <q-date v-model="endDateQDate" @update:model-value="onSearch">
                  <div class="row items-center justify-end">
                    <q-btn v-close-popup label="Close" color="primary" flat />
                  </div>
                </q-date>
              </q-popup-proxy>
            </q-icon>
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-2">
        <q-btn
          flat
          label="Clear Filters"
          color="grey"
          @click="clearFilters"
          :disable="!hasActiveFilters"
        />
      </div>
      <q-space />
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Add Leave"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddEmployeeLeave
      v-model="showAddDialog"
      @saved="onEmployeeLeaveSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useEmployeeLeaveStore } from '../../../stores/employee-leave-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import AddEmployeeLeave from './AddEmployeeLeave.vue';

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

// Helper function to convert date format from yyyy/MM/dd to yyyy-MM-dd
const convertDateFormat = (date: string | null): string | null => {
  if (!date) return null;
  // If already in yyyy-MM-dd format, return as is
  if (date.includes('-')) return date;
  // Convert from yyyy/MM/dd to yyyy-MM-dd
  return date.replace(/\//g, '-');
};

// Helper function to convert date format from yyyy-MM-dd to yyyy/MM/dd for q-date
const convertToQDateFormat = (date: string | null): string | null => {
  if (!date) return null;
  // If already in yyyy/MM/dd format, return as is
  if (date.includes('/')) return date;
  // Convert from yyyy-MM-dd to yyyy/MM/dd
  return date.replace(/-/g, '/');
};

const searchFilters = computed({
  get: () => employeeLeaveStore.searchFilters,
  set: (value) => {
    employeeLeaveStore.searchFilters = value;
  },
});

// Computed properties for date inputs (HTML date format: yyyy-MM-dd)
const startDateInput = computed({
  get: () => convertDateFormat(searchFilters.value.startDate),
  set: (value: string | null) => {
    employeeLeaveStore.searchFilters.startDate = value;
  },
});

const endDateInput = computed({
  get: () => convertDateFormat(searchFilters.value.endDate),
  set: (value: string | null) => {
    employeeLeaveStore.searchFilters.endDate = value;
  },
});

// Computed properties for q-date components (Quasar format: yyyy/MM/dd)
const startDateQDate = computed({
  get: () => convertToQDateFormat(searchFilters.value.startDate),
  set: (value: string | null) => {
    const converted = convertDateFormat(value);
    employeeLeaveStore.searchFilters.startDate = converted;
  },
});

const endDateQDate = computed({
  get: () => convertToQDateFormat(searchFilters.value.endDate),
  set: (value: string | null) => {
    const converted = convertDateFormat(value);
    employeeLeaveStore.searchFilters.endDate = converted;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.leaveTypeId ||
    searchFilters.value.startDate ||
    searchFilters.value.endDate
  );
});

const onSearch = async () => {
  await employeeLeaveStore.fetchEmployeeLeaves();
};

const clearFilters = async () => {
  employeeLeaveStore.searchFilters = {
    leaveTypeId: null,
    startDate: null,
    endDate: null,
  };
  await onSearch();
};

// Fetch leave types on mount only if not already loaded
onMounted(async () => {
  if (employeeStore.leaveTypes.length === 0) {
    await employeeStore.fetchLeaveTypes();
  }
});

const showAddDialog = ref<boolean>(false);


const onEmployeeLeaveSaved = async () => {
  // Refresh the list after a new leave is added
  await employeeLeaveStore.fetchEmployeeLeaves();
};

</script>

<style scoped>
</style>

