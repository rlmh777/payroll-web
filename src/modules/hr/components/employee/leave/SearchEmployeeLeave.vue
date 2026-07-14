<template>
  <div >
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-2">
        <LeaveTypeSelect
          v-model="searchFilters.leaveTypeId"
          label="Filter by Leave Type"
        />
      </div>
      <div class="col-12 col-md-2">
        <DateField
          v-model="startDateModel"
          label="Start Date"
          clearable
        />
      </div>
      <div class="col-12 col-md-2">
        <DateField
          v-model="endDateModel"
          label="End Date"
          clearable
        />
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
import DateField from '@core/components/common/DateField.vue';
import { useEmployeeLeaveStore } from '@/stores/employee-leave-store';
import { useEmployeeStore } from '@/stores/employee-store';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import AddEmployeeLeave from './AddEmployeeLeave.vue';

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

const searchFilters = computed({
  get: () => employeeLeaveStore.searchFilters,
  set: (value) => {
    employeeLeaveStore.searchFilters = value;
  },
});

const startDateModel = computed({
  get: () => searchFilters.value.startDate,
  set: (value: string | null) => {
    employeeLeaveStore.searchFilters.startDate = value;
  },
});

const endDateModel = computed({
  get: () => searchFilters.value.endDate,
  set: (value: string | null) => {
    employeeLeaveStore.searchFilters.endDate = value;
  },
});

const hasActiveFilters = computed(() => employeeLeaveStore.hasActiveSearchFilters);

const emit = defineEmits<{
  saved: [];
}>();

function clearFilters() {
  employeeLeaveStore.resetSearchFilters();
}

onMounted(async () => {
  if (employeeStore.leaveTypes.length === 0) {
    await employeeStore.fetchLeaveTypes();
  }
});

const showAddDialog = ref<boolean>(false);

const onEmployeeLeaveSaved = () => {
  emit('saved');
};

</script>

<style scoped>
</style>
