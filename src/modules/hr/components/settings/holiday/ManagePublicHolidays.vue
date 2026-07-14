<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search holidays"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add holiday" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Public Holidays"
          :rows="store.holidays"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onRequest"
          no-data-label="No holidays"
        >
          <template #body-cell-payMultiplier="props">
            <q-td :props="props">{{ formatMultiplier(props.row.payMultiplier) }}</q-td>
          </template>
          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.isActive ? 'check_circle' : 'cancel'"
                :color="props.row.isActive ? 'positive' : 'grey'"
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

    <q-dialog v-model="showDialog" persistent>
      <q-card style="min-width: 420px">
        <q-card-section>
          <div class="text-h6">{{ editingId ? 'Edit holiday' : 'Add holiday' }}</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" label="Name" outlined dense />
          <DateField v-model="form.startDate" label="Start date" required />
          <DateField v-model="form.endDate" label="End date" required />
          <q-input
            v-model.number="form.payMultiplier"
            type="number"
            label="Pay multiplier"
            hint="1.5 = time and a half (default), 2 = double time"
            outlined
            dense
            min="0"
            step="0.01"
          />
          <q-toggle v-model="form.isActive" label="Active" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="saving" @click="save" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import {
  usePublicHolidayStore,
  type PublicHoliday,
  type PublicHolidayPayload,
} from 'src/stores/public-holiday-store';

const store = usePublicHolidayStore();
const $q = useQuasar();

const search = ref('');
const showDialog = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);

const form = ref<PublicHolidayPayload & { isActive: boolean }>({
  name: '',
  startDate: '',
  endDate: '',
  payMultiplier: 1.5,
  isActive: true,
});

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'startDate',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'startDate', label: 'Start', field: 'startDate', align: 'left', sortable: true },
  { name: 'endDate', label: 'End', field: 'endDate', align: 'left', sortable: true },
  { name: 'payMultiplier', label: 'Pay multiplier', field: 'payMultiplier', align: 'right' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function formatMultiplier(value: string | number) {
  return Number(value).toFixed(2);
}

async function refresh() {
  store.search = search.value.trim();
  await store.fetchHolidays({
    page: pagination.value.page,
    perPage: pagination.value.rowsPerPage,
    search: store.search,
  });
  pagination.value.rowsNumber = store.total;
}

async function onRequest(props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) {
  pagination.value = {
    ...props.pagination,
    rowsNumber: props.pagination.rowsNumber ?? pagination.value.rowsNumber,
  };
  await refresh();
}

function resetForm() {
  form.value = {
    name: '',
    startDate: '',
    endDate: '',
    payMultiplier: 1.5,
    isActive: true,
  };
  editingId.value = null;
}

function openCreate() {
  resetForm();
  showDialog.value = true;
}

function openEdit(row: PublicHoliday) {
  editingId.value = row.id;
  form.value = {
    name: row.name,
    startDate: row.startDate.slice(0, 10),
    endDate: row.endDate.slice(0, 10),
    payMultiplier: Number(row.payMultiplier),
    isActive: row.isActive,
  };
  showDialog.value = true;
}

async function save() {
  if (!form.value.name.trim() || !form.value.startDate || !form.value.endDate) {
    $q.notify({ type: 'negative', message: 'Name and dates are required.' });
    return;
  }

  saving.value = true;

  try {
    if (editingId.value) {
      await store.updateHoliday(editingId.value, form.value);
      $q.notify({ type: 'positive', message: 'Holiday updated.' });
    } else {
      await store.createHoliday(form.value);
      $q.notify({ type: 'positive', message: 'Holiday created.' });
    }

    showDialog.value = false;
    await refresh();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}

function onDelete(row: PublicHoliday) {
  $q.dialog({
    title: 'Delete holiday',
    message: `Delete "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteHoliday(row.id);
        $q.notify({ type: 'positive', message: 'Holiday deleted.' });
        await refresh();
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

onMounted(refresh);
</script>
