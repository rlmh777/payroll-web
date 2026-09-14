<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Scheduler daily metrics</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Configure optional per-day values shown under the scheduler date headers
          (for example guests and rooms occupied). Enable at least one metric to show the row.
          GM and admin users with edit rights can double-click a day cell to update values.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search metrics"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add metric" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pt-none">
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="filteredRows"
          :columns="columns"
          :loading="store.isLoadingDefinitions"
          no-data-label="No scheduler metrics configured"
        >
          <template #body-cell-is_active="props">
            <q-td :props="props">
              <q-toggle
                :model-value="props.row.is_active"
                color="primary"
                dense
                @update:model-value="(value) => toggleActive(props.row, value)"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <SchedulerMetricDefinitionDialog
      v-model="showDialog"
      :record="editing"
      @saved="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useSchedulerMetricStore,
  type SchedulerMetricDefinition,
} from '@hr/stores/scheduler-metric-store';
import SchedulerMetricDefinitionDialog from './SchedulerMetricDefinitionDialog.vue';

defineProps<{ title?: string }>();

const $q = useQuasar();
const store = useSchedulerMetricStore();
const search = ref('');
const showDialog = ref(false);
const editing = ref<SchedulerMetricDefinition | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  {
    name: 'short_label',
    label: 'Short label',
    field: (row: SchedulerMetricDefinition) => row.short_label || '—',
    align: 'left',
  },
  {
    name: 'value_type',
    label: 'Type',
    field: (row: SchedulerMetricDefinition) => (row.value_type === 'decimal' ? 'Decimal' : 'Whole number'),
    align: 'left',
  },
  { name: 'sort_order', label: 'Order', field: 'sort_order', align: 'center', sortable: true },
  { name: 'is_active', label: 'On scheduler', field: 'is_active', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const filteredRows = computed(() => {
  const term = search.value.trim().toLowerCase();
  if (!term) {
    return store.definitions;
  }

  return store.definitions.filter((row) =>
    [row.name, row.code, row.short_label ?? ''].some((value) => value.toLowerCase().includes(term)),
  );
});

async function refresh() {
  await store.fetchDefinitions({ activeOnly: false });
}

function openCreate() {
  editing.value = null;
  showDialog.value = true;
}

function openEdit(row: SchedulerMetricDefinition) {
  editing.value = row;
  showDialog.value = true;
}

async function toggleActive(row: SchedulerMetricDefinition, isActive: boolean) {
  try {
    await store.updateDefinition(row.id, {
      code: row.code,
      name: row.name,
      short_label: row.short_label ?? null,
      value_type: row.value_type,
      sort_order: row.sort_order,
      is_active: isActive,
    });
    $q.notify({
      type: 'positive',
      message: isActive ? 'Metric enabled on scheduler' : 'Metric hidden from scheduler',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update metric',
    });
  }
}

function confirmDelete(row: SchedulerMetricDefinition) {
  $q.dialog({
    title: 'Delete metric',
    message: `Delete “${row.name}”? Existing daily values for this metric will also be removed.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteDefinition(row.id);
        $q.notify({ type: 'positive', message: 'Metric deleted' });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to delete metric',
        });
      }
    })();
  });
}

onMounted(() => {
  void refresh();
});
</script>
