<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="store.search"
          dense
          outlined
          clearable
          label="Search pool types"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add pool type" @click="showCreate = true" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Pool Distribution Types"
          :rows="store.types"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onRequest"
          no-data-label="No pool distribution types configured"
        >
          <template #body-cell-is_active="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.is_active ? 'check_circle' : 'cancel'"
                :color="props.row.is_active ? 'positive' : 'grey'"
              />
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <PoolDistributionTypeDialog
      v-model="showCreate"
      @saved="refresh"
    />
    <PoolDistributionTypeDialog
      v-model="showEdit"
      :record="editing"
      @saved="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  usePoolDistributionTypeStore,
  POOL_CALCULATION_MODE_OPTIONS,
  type PoolDistributionType,
} from '@payroll/stores/pool-distribution-type-store';
import PoolDistributionTypeDialog from './PoolDistributionTypeDialog.vue';

defineProps<{ title?: string }>();

const store = usePoolDistributionTypeStore();
const $q = useQuasar();
const showCreate = ref(false);
const showEdit = ref(false);
const editing = ref<PoolDistributionType | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'sort_order',
  descending: false,
});

const modeLabel = (mode: string) =>
  POOL_CALCULATION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'code', label: 'Code', field: 'code', align: 'left', sortable: true },
  {
    name: 'calculation_mode',
    label: 'Calculation',
    field: (row: PoolDistributionType) => modeLabel(row.calculation_mode),
    align: 'left',
  },
  {
    name: 'earning',
    label: 'Earning code',
    field: (row: PoolDistributionType) => row.payrollEarningCode?.code ?? '—',
    align: 'left',
  },
  { name: 'is_active', label: 'Active', field: 'is_active', align: 'center' },
  {
    name: 'requires_hours_eligibility',
    label: 'Hours gate',
    field: (row: PoolDistributionType) => (row.requires_hours_eligibility ? 'Yes' : 'No'),
    align: 'center',
  },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchTypes(pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total;
}

function openEdit(row: PoolDistributionType) {
  editing.value = row;
  showEdit.value = true;
}

function onDelete(row: PoolDistributionType) {
  $q.dialog({
    title: 'Delete pool type',
    message: `Delete "${row.name}"? Employee point history for this type will also be removed.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteType(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Pool type deleted.' });
        await refresh();
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

function onRequest(props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) {
  pagination.value = {
    page: props.pagination.page,
    rowsPerPage: props.pagination.rowsPerPage,
    rowsNumber: props.pagination.rowsNumber ?? pagination.value.rowsNumber,
    sortBy: props.pagination.sortBy,
    descending: props.pagination.descending,
  };
  void refresh();
}

onMounted(refresh);
</script>
