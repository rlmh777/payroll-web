<template>
  <div class="time-travel">
    <div class="row items-center q-gutter-sm q-mb-md">
      <q-input
        v-model="search"
        dense
        outlined
        clearable
        debounce="300"
        label="Search events"
        class="col-grow"
      />
      <q-select
        v-model="eventFilter"
        dense
        outlined
        clearable
        emit-value
        map-options
        label="Event"
        :options="eventOptions"
        style="min-width: 140px"
      />
      <q-select
        v-model="resourceFilter"
        dense
        outlined
        clearable
        emit-value
        map-options
        label="Resource"
        :options="resourceOptions"
        style="min-width: 180px"
      />
      <q-btn flat round icon="refresh" color="primary" :loading="store.isLoading" @click="reload(false)">
        <q-tooltip>Refresh</q-tooltip>
      </q-btn>
    </div>

    <div v-if="store.error" class="text-negative q-mb-md">{{ store.error }}</div>

    <q-banner v-if="!store.isLoading && store.events.length === 0" class="bg-grey-2 text-grey-8" rounded>
      No activity recorded for this employee yet. Changes made from now on will appear here.
    </q-banner>

    <q-timeline v-else color="primary">
      <q-timeline-entry
        v-for="item in store.events"
        :key="item.id"
        :title="item.description"
        :subtitle="formatMeta(item)"
        :icon="eventIcon(item.event)"
        :color="eventColor(item.event)"
      >
        <div class="text-caption text-grey-7 q-mb-sm">
          {{ formatDate(item.occurredAt) }}
          <span v-if="item.causer"> · {{ item.causer.name || item.causer.email || 'System' }}</span>
          <span v-if="item.table"> · {{ item.table }}</span>
        </div>

        <q-markup-table v-if="item.changes?.length" flat bordered dense class="change-table">
          <thead>
            <tr>
              <th class="text-left">Field</th>
              <th class="text-left">Before</th>
              <th class="text-left">After</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="change in item.changes" :key="`${item.id}-${change.field}`">
              <td>{{ change.field }}</td>
              <td class="text-grey-7">{{ formatValue(change.old) }}</td>
              <td>{{ formatValue(change.new) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-timeline-entry>
    </q-timeline>

    <div v-if="store.lastPage > 1" class="row justify-center q-mt-md">
      <q-pagination
        v-model="store.page"
        :max="store.lastPage"
        direction-links
        boundary-links
        @update:model-value="reload(false)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import {
  useEmployeeTimeTravelStore,
  type TimeTravelEvent,
} from 'src/stores/employee-time-travel-store';

const props = defineProps<{
  employeeId: string;
}>();

const store = useEmployeeTimeTravelStore();
const search = ref('');
const eventFilter = ref<string | null>(null);
const resourceFilter = ref<string | null>(null);

const eventOptions = [
  { label: 'Created', value: 'created' },
  { label: 'Updated', value: 'updated' },
  { label: 'Deleted', value: 'deleted' },
];

const resourceOptions = [
  { label: 'Employee', value: 'employee' },
  { label: 'Person', value: 'person' },
  { label: 'Employment detail', value: 'employment_detail' },
  { label: 'Compensation', value: 'employee_compensation' },
  { label: 'Default allowance', value: 'employee_default_allowance' },
  { label: 'Default deduction', value: 'employee_default_deduction' },
  { label: 'Bank', value: 'employee_bank' },
  { label: 'Contact', value: 'employee_contact' },
  { label: 'Document', value: 'employee_document' },
  { label: 'Incident', value: 'employee_incident' },
  { label: 'Leave', value: 'employee_leave' },
  { label: 'Timesheet', value: 'timesheet' },
  { label: 'SS benefit', value: 'employee_ss_benefit_status' },
];

function eventIcon(event?: string | null): string {
  if (event === 'created') return 'add_circle';
  if (event === 'deleted') return 'delete';
  return 'edit';
}

function eventColor(event?: string | null): string {
  if (event === 'created') return 'positive';
  if (event === 'deleted') return 'negative';
  return 'primary';
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function formatMeta(item: TimeTravelEvent): string {
  const parts = [item.event, item.resource].filter(Boolean);
  return parts.join(' · ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value);
  }
  if (typeof value === 'object') return JSON.stringify(value);
  return '—';
}

async function reload(resetPage = false) {
  if (!props.employeeId) return;
  if (resetPage) store.page = 1;
  await store.fetchTimeline(props.employeeId, {
    page: store.page,
    search: search.value || null,
    event: eventFilter.value,
    resource: resourceFilter.value,
  });
}

watch(
  () => props.employeeId,
  () => {
    store.reset();
    void reload(true);
  },
);

watch([search, eventFilter, resourceFilter], () => {
  void reload(true);
});

onMounted(() => {
  void reload(true);
});
</script>

<style scoped>
.change-table {
  max-width: 100%;
  background: transparent;
}

.change-table td,
.change-table th {
  font-size: 12px;
}
</style>
