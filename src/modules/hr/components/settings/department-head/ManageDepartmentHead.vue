<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchDepartmentHead />
      <q-card-section class="q-pa-none">
        <q-table
          title="Department Heads"
          :rows="assignments"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingAssignments"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20]"
          @request="onRequest"
          no-data-label="No department head assignments"
        >
          <template #body-cell-isCurrent="props">
            <q-td :props="props">
              <q-chip
                dense
                square
                outline
                :color="props.row.isCurrent ? 'positive' : 'grey-6'"
                :label="props.row.isCurrent ? 'Current' : 'Ended'"
              />
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
                  @click="store.setAssignmentToEdit(props.row)"
                >
                  <q-tooltip>Edit assignment</q-tooltip>
                </q-btn>
                <q-btn
                  v-if="!props.row.isCurrent"
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  class="action-btn"
                  @click="onDelete(props.row)"
                >
                  <q-tooltip>Delete assignment</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <AddDepartmentHead />
    <UpdateDepartmentHead />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useDepartmentHeadStore,
  type DepartmentHeadAssignment,
} from 'src/stores/department-head-store';
import SearchDepartmentHead from './SearchDepartmentHead.vue';
import AddDepartmentHead from './AddDepartmentHead.vue';
import UpdateDepartmentHead from './UpdateDepartmentHead.vue';

const store = useDepartmentHeadStore();
const $q = useQuasar();

const pagination = ref({
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
  sortBy: 'startDate',
  descending: true,
});

const columns: QTableProps['columns'] = [
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left', sortable: true },
  { name: 'employeeName', label: 'Head', field: 'employeeName', align: 'left', sortable: true },
  { name: 'employeeCode', label: 'Code', field: 'employeeCode', align: 'left' },
  { name: 'startDate', label: 'Start', field: 'startDate', align: 'left', sortable: true },
  { name: 'endDate', label: 'End', field: (row) => row.endDate ?? '—', align: 'left' },
  { name: 'isCurrent', label: 'Status', field: 'isCurrent', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const assignments = computed(() => store.assignments);

watch(
  () => [store.search, store.filterDepartmentId, store.filterCurrentOnly],
  async () => {
    pagination.value.page = 1;
    await store.fetchAssignments(1, pagination.value.rowsPerPage);
    pagination.value.rowsNumber = store.total;
  },
);

watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  },
);

const onRequest = async (props: { pagination: { page: number; rowsPerPage: number } }) => {
  const { page, rowsPerPage } = props.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  await store.fetchAssignments(page, rowsPerPage);
  pagination.value.rowsNumber = store.total;
};

const onDelete = (row: DepartmentHeadAssignment) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Delete the ended assignment for ${row.employeeName ?? 'this employee'}?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteAssignment(row.id);
        pagination.value.rowsNumber = store.total;
        $q.notify({
          color: 'positive',
          position: 'top',
          message: 'Assignment deleted.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Failed to delete assignment.',
        });
      }
    })();
  });
};

onMounted(async () => {
  await store.fetchAssignments(1, pagination.value.rowsPerPage);
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
