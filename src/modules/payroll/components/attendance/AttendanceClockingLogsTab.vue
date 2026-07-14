<template>
  <attendance-filter-panel
    class="q-mb-md"
    title="Clocking log filters"
    description="Review raw device events. Timesheets are built automatically after import and on the nightly schedule."
    :active-filter-count="activeFilterCount"
  >
    <div class="col-12 col-sm-6 col-lg-2">
      <DateField
        :model-value="props.filter.startDate || null"
        label="Start date"
        stack-label
        @update:model-value="updateFilter('startDate', $event)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-2">
      <DateField
        :model-value="props.filter.endDate || null"
        label="End date"
        stack-label
        @update:model-value="updateFilter('endDate', $event)"
      />
    </div>
    <div class="col-12 col-sm-6 col-lg-4">
      <q-input
        :model-value="props.filter.biometricUserId"
        outlined
        dense
        clearable
        label="Employee / biometric ID"
        placeholder="EMP001"
        @update:model-value="updateFilter('biometricUserId', $event)"
      >
        <template #prepend><q-icon name="badge" /></template>
      </q-input>
    </div>
    <div class="col-12 col-sm-6 col-lg-4">
      <q-input
        :model-value="props.filter.deviceId"
        outlined
        dense
        clearable
        label="Device / site ID"
        placeholder="DEV-01"
        @update:model-value="updateFilter('deviceId', $event)"
      >
        <template #prepend><q-icon name="fingerprint" /></template>
      </q-input>
    </div>
    <template #actions>
      <q-btn flat color="grey-8" icon="restart_alt" label="Reset" @click="emit('reset-filter')" />
      <q-btn unelevated color="primary" icon="search" label="Apply filters" @click="emit('apply-filter')" />
    </template>
  </attendance-filter-panel>

  <q-card flat bordered class="attendance-data-card">
    <q-card-section class="row items-center justify-between q-col-gutter-md">
      <div class="col-12 col-sm">
        <div class="text-subtitle1 text-weight-medium">Raw clocking events</div>
        <div class="text-caption text-grey-7">
          Device punches used for automatic timesheet processing.
        </div>
      </div>
      <div class="col-12 col-sm-auto">
        <q-chip outline color="primary" icon="database" :label="`${props.pagination.rowsNumber} events`" />
      </div>
    </q-card-section>

    <q-separator />

    <q-table
      class="attendance-table"
      :rows="props.clockingLogs"
      :columns="clockingColumns"
      row-key="id"
      flat
      hide-bottom
      separator="horizontal"
      :pagination="{ rowsPerPage: 0 }"
      :loading="props.isLoadingClockingLogs"
    >
      <template #body-cell-biometricUserId="tableProps">
        <q-td :props="tableProps">
          <div class="row items-center no-wrap q-gutter-sm">
            <q-avatar color="blue-1" text-color="primary" icon="badge" size="30px" />
            <span class="text-weight-medium">{{ tableProps.row.biometricUserId }}</span>
          </div>
        </q-td>
      </template>
      <template #body-cell-deviceId="tableProps">
        <q-td :props="tableProps">
          <q-chip v-if="tableProps.row.deviceId" dense square color="grey-2" text-color="grey-9" icon="fingerprint">
            {{ tableProps.row.deviceId }}
          </q-chip>
          <span v-else class="text-grey-5">Not supplied</span>
        </q-td>
      </template>
      <template #body-cell-punchDateTime="tableProps">
        <q-td :props="tableProps">
          <div class="text-weight-medium">{{ formatDateTime(tableProps.row.punchDateTime) }}</div>
        </q-td>
      </template>
      <template #body-cell-punchType="tableProps">
        <q-td :props="tableProps">
          <q-badge
            v-if="tableProps.row.punchType"
            rounded
            :color="tableProps.row.punchType === 'OUT' ? 'deep-orange' : 'positive'"
            :label="tableProps.row.punchType"
          />
          <span v-else class="text-grey-5">Unspecified</span>
        </q-td>
      </template>
      <template #body-cell-created_at="tableProps">
        <q-td :props="tableProps" class="text-grey-7">{{ formatDateTime(tableProps.row.created_at) }}</q-td>
      </template>
      <template #no-data>
        <div class="full-width column items-center text-grey-6 q-py-xl">
          <q-icon name="fingerprint" size="44px" class="q-mb-sm" />
          <div class="text-subtitle2">No clocking events found</div>
          <div class="text-caption">Adjust the filters or import a biometric export file.</div>
        </div>
      </template>
    </q-table>

    <q-separator />

    <div class="row items-center justify-between q-pa-md">
      <div class="text-caption text-grey-7">
        Page {{ props.pagination.page }} of {{ props.lastPage }} · {{ props.pagination.rowsNumber }} total events
      </div>
      <div class="row q-gutter-xs">
        <q-btn
          outline
          color="grey-8"
          icon="chevron_left"
          label="Previous"
          :disable="props.pagination.page <= 1 || props.isLoadingClockingLogs"
          @click="emit('load-page', props.pagination.page - 1)"
        />
        <q-btn
          outline
          color="grey-8"
          icon-right="chevron_right"
          label="Next"
          :disable="props.pagination.page >= props.lastPage || props.isLoadingClockingLogs"
          @click="emit('load-page', props.pagination.page + 1)"
        />
      </div>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import AttendanceFilterPanel from './AttendanceFilterPanel.vue';
import type { ClockingFilterForm } from './types';
import { formatDateTime } from './utils';
import type { ClockingLogRow, PaginationState } from '@payroll/stores/attendance-store';

const props = defineProps<{
  filter: ClockingFilterForm;
  clockingLogs: ClockingLogRow[];
  isLoadingClockingLogs: boolean;
  pagination: PaginationState;
  lastPage: number;
}>();

const emit = defineEmits<{
  (event: 'update:filter', value: ClockingFilterForm): void;
  (event: 'apply-filter'): void;
  (event: 'reset-filter'): void;
  (event: 'load-page', page: number): void;
}>();

const activeFilterCount = computed(
  () => Object.values(props.filter).filter((value) => String(value ?? '').trim() !== '').length,
);

const clockingColumns = [
  { name: 'biometricUserId', label: 'Employee / Biometric ID', field: 'biometricUserId', align: 'left' as const },
  { name: 'deviceId', label: 'Device / Site', field: 'deviceId', align: 'left' as const },
  { name: 'punchDateTime', label: 'Punch date & time', field: 'punchDateTime', align: 'left' as const },
  { name: 'punchType', label: 'Punch type', field: 'punchType', align: 'left' as const },
  { name: 'created_at', label: 'Imported at', field: 'created_at', align: 'left' as const },
];

function updateFilter(field: keyof ClockingFilterForm, value: string | number | null) {
  emit('update:filter', { ...props.filter, [field]: String(value ?? '') });
}
</script>

<style scoped>
.attendance-data-card {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}

:deep(.attendance-table thead tr) {
  background: #f7f9fc;
}

:deep(.attendance-table th) {
  color: #52606d;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
}

:deep(.attendance-table tbody tr:hover) {
  background: #f8fbff;
}
</style>
