<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchDepartment />
      <q-card-section class="q-pa-none">
        <q-table
          v-model:pagination="pagination"
          title="Departments"
          :rows="departments"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          :rows-per-page-options="[10, 15, 20]"
          @request="onRequest"
          no-data-label="No departments"
        >
          <template #body-cell-workTimesheet="props">
            <q-td :props="props">
              {{ props.row.current_work_timesheet_assignment?.work_timesheet?.name ?? 'Default Timesheet' }}
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <div class="action-buttons">
                <q-btn
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  size="sm"
                  class="action-btn"
                  @click="onEdit(props.row)"
                >
                  <q-tooltip>Edit Department</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  class="action-btn"
                  @click="confirmDelete(props.row)"
                >
                  <q-tooltip>Delete Department</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <UpdateDepartment />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { type QTableProps, useQuasar } from 'quasar';
import { useDepartmentStore, type Department } from 'src/stores/department-store';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';
import SearchDepartment from './SearchDepartment.vue';
import UpdateDepartment from './UpdateDepartment.vue';

const store = useDepartmentStore();
const workTimesheetStore = useWorkTimesheetStore();
const $q = useQuasar();
const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'parent',
    label: 'Parent',
    field: (row: Department) => row.parent?.name ?? '',
    align: 'left',
  },
  {
    name: 'workTimesheet',
    label: 'Working hour timesheet',
    field: 'workTimesheet',
    align: 'left',
  },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const departments = computed(() => store.departments);

function onEdit(department: Department) {
  store.setDepartmentToEdit(department);
}

function confirmDelete(department: Department) {
  $q.dialog({
    title: 'Delete Department',
    message: `Delete "${department.name}"?`,
    cancel: true,
    persistent: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void deleteDepartment(department);
  });
}

async function deleteDepartment(department: Department) {
  const success = await store.deleteDepartment(department.id);
  if (success) {
    $q.notify({ type: 'positive', message: 'Department deleted.' });
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  await store.fetchDepartments({ page, perPage: rowsPerPage });
}

watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await store.fetchDepartments({ page: 1, perPage: pagination.value.rowsPerPage });
  },
);

watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  },
);

onMounted(async () => {
  await Promise.all([
    store.fetchDepartments({ page: 1, perPage: pagination.value.rowsPerPage }),
    store.fetchDepartmentOptions(),
    workTimesheetStore.fetchWorkTimesheets(),
  ]);
  pagination.value.rowsNumber = store.total;
});
</script>

<style scoped>
.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>
