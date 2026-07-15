<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="store.search"
          dense
          outlined
          clearable
          label="Search job titles"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add job title" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Job Titles"
          :rows="store.jobTitles"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingJobTitles"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onRequest"
          no-data-label="No job titles"
        >
          <template #body-cell-payScale="props">
            <q-td :props="props">{{ props.row.payScale || '—' }}</q-td>
          </template>
          <template #body-cell-jobDescription="props">
            <q-td :props="props">
              <q-btn
                v-if="props.row.jobDescriptionUrl"
                flat
                dense
                round
                color="primary"
                icon="picture_as_pdf"
                type="a"
                :href="props.row.jobDescriptionUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                <q-tooltip>View job description</q-tooltip>
              </q-btn>
              <span v-else class="text-grey-6">—</span>
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

    <AddJobTitle v-model="showCreateDialog" @saved="refresh" />
    <UpdateJobTitle
      v-model="showEditDialog"
      :job-title="store.jobTitleToEdit"
      @updated="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useJobTitleStore, type JobTitle } from '@core/stores/job-title-store';
import AddJobTitle from './AddJobTitle.vue';
import UpdateJobTitle from './UpdateJobTitle.vue';

const store = useJobTitleStore();
const $q = useQuasar();
const showCreateDialog = ref(false);
const showEditDialog = ref(false);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Job title', field: 'name', align: 'left', sortable: true },
  { name: 'payScale', label: 'Pay scale', field: 'payScale', align: 'left', sortable: true },
  { name: 'jobDescription', label: 'Description', field: 'jobDescriptionPath', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchJobTitles(pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total;
}

async function onRequest(props: Parameters<NonNullable<QTableProps['onRequest']>>[0]) {
  pagination.value = {
    ...props.pagination,
    rowsNumber: props.pagination.rowsNumber ?? pagination.value.rowsNumber,
  };
  await refresh();
}

function openCreate() {
  showCreateDialog.value = true;
}

function openEdit(row: JobTitle) {
  store.setJobTitleToEdit(row);
  showEditDialog.value = true;
}

function onDelete(row: JobTitle) {
  $q.dialog({
    title: 'Delete job title',
    message: `Delete "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteJobTitle(row.id);
        $q.notify({ type: 'positive', message: 'Job title deleted.' });
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

watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await refresh();
  },
);

watch(showEditDialog, (open) => {
  if (!open) store.setJobTitleToEdit(null);
});

onMounted(refresh);
</script>
