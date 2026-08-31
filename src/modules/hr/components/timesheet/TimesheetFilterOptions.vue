<template>
  <div class="timesheet-filter-options q-pb-md">
    <div class="q-mt-sm">
      <DateField
        :model-value="timesheetStore.startDate || null"
        label="Start date"
        stack-label
        @update:model-value="onStartDateChange"
      />
    </div>

    <div class="q-mt-md">
      <DateField
        :model-value="timesheetStore.endDate || null"
        label="End date"
        stack-label
        @update:model-value="onEndDateChange"
      />
    </div>

    <div class="q-mt-md">
      <EmployeeGroupSelect
        :model-value="schedulerStore.filterEmployeeGroupId"
        label="Employee group"
        @update:model-value="schedulerStore.setFilterEmployeeGroupId($event)"
      />
    </div>

    <div class="q-mt-md">
      <DepartmentSelect
        :model-value="schedulerStore.filterDepartmentId"
        label="Department"
        clearable
        @update:model-value="schedulerStore.setFilterDepartmentId($event)"
      />
    </div>

    <div class="q-mt-md">
      <q-select
        :model-value="schedulerStore.filterEmployeeId"
        :options="employeeOptions"
        label="Employee"
        outlined
        dense
        clearable
        emit-value
        map-options
        use-input
        input-debounce="200"
        @filter="filterEmployees"
        @update:model-value="schedulerStore.setFilterEmployeeId($event)"
      />
    </div>

    <div class="q-mt-md">
      <q-select
        :model-value="timesheetStore.filterApprovalStatus"
        :options="approvalOptions"
        label="Review status"
        outlined
        dense
        clearable
        emit-value
        map-options
        @update:model-value="timesheetStore.setFilterApprovalStatus($event)"
      />
    </div>

    <q-separator class="q-my-md" />

    <div v-if="hasActiveFilters" class="q-mt-md">
      <q-btn
        flat
        dense
        color="primary"
        icon="filter_alt_off"
        label="Clear filters"
        class="full-width"
        @click="clearFilters"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import EmployeeGroupSelect from '@hr/components/employee-group/EmployeeGroupSelect.vue';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';

const schedulerStore = useSchedulerStore();
const timesheetStore = useTimesheetStore();
const attendanceStore = useAttendanceStore();

const employeeSearch = ref('');

const approvalOptions = [
  { label: 'Reviewed', value: 'APPROVED' as const },
  { label: 'Pending review', value: 'PENDING' as const },
];

const employeeOptions = computed(() => {
  const search = employeeSearch.value.trim().toLowerCase();
  const unique = new Map<string, { label: string; value: string }>();

  for (const row of attendanceStore.timesheets) {
    if (unique.has(row.employeeId)) {
      continue;
    }

    const label = `${row.employeeName ?? 'Unknown employee'}${row.employeeCode ? ` (${row.employeeCode})` : ''}`;
    const haystack = `${row.employeeName ?? ''} ${row.employeeCode ?? ''}`.toLowerCase();
    if (search && !haystack.includes(search)) {
      continue;
    }

    unique.set(row.employeeId, {
      label,
      value: row.employeeId,
    });
  }

  return Array.from(unique.values()).sort((left, right) => left.label.localeCompare(right.label));
});

const hasActiveFilters = computed(
  () => timesheetStore.hasActiveFilters,
);

function filterEmployees(value: string, update: (callback: () => void) => void) {
  update(() => {
    employeeSearch.value = value;
  });
}

function onStartDateChange(value: string | null) {
  timesheetStore.setDateRange(value ?? timesheetStore.startDate, timesheetStore.endDate);
}

function onEndDateChange(value: string | null) {
  timesheetStore.setDateRange(timesheetStore.startDate, value ?? timesheetStore.endDate);
}

function clearFilters() {
  timesheetStore.clearFilters();
  employeeSearch.value = '';
}
</script>

<style scoped>
.timesheet-filter-options {
  padding-top: 4px;
}
</style>
