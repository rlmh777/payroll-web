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

    <ViewByEmployeeFilters @members-changed="$emit('members-changed')" />

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
import { computed } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import ViewByEmployeeFilters from '@hr/components/shared/ViewByEmployeeFilters.vue';
import { useTimesheetStore } from '@hr/stores/timesheet-store';

defineEmits<{
  'members-changed': [];
}>();

const timesheetStore = useTimesheetStore();

const approvalOptions = [
  { label: 'Reviewed', value: 'APPROVED' as const },
  { label: 'Pending review', value: 'PENDING' as const },
];

const hasActiveFilters = computed(
  () => timesheetStore.hasActiveFilters,
);

function onStartDateChange(value: string | null) {
  timesheetStore.setDateRange(value ?? timesheetStore.startDate, timesheetStore.endDate);
}

function onEndDateChange(value: string | null) {
  timesheetStore.setDateRange(timesheetStore.startDate, value ?? timesheetStore.endDate);
}

function clearFilters() {
  timesheetStore.clearFilters();
}
</script>

<style scoped>
.timesheet-filter-options {
  padding-top: 4px;
}
</style>
