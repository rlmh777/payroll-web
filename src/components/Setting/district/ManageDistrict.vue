<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchDistrict v-model:modelValue="store.search" />
      <q-card-section class="q-pa-none">
        <q-table
          title="Districts"
          :rows="districts"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingDistricts"
          :v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20]"
          server-side
          @request="onRequest"
          no-data-label="No countries"
        >
          <template v-slot:body-cell-actions="props">
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
                  <q-tooltip>Edit District</q-tooltip>
                </q-btn>
                <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  class="action-btn"
                  @click="onDelete(props.row)"
                >
                  <q-tooltip>Delete District</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <UpdateDistrict v-model="dialogOpen" />
  </q-page>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { type QTableProps } from 'quasar';
import { useDistrictStore, type District } from '../../../stores/district-store';
import SearchDistrict from './SearchDistrict.vue';
import UpdateDistrict from './UpdateDistrict.vue';

const store = useDistrictStore();
const dialogOpen = ref(false);
const $q = useQuasar();

const pagination = ref({
  page: 1,
  rowsPerPage: store.total,
  rowsNumber: store.total,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'country',
    label: 'Country',
    field: (row) => row.country?.name ?? '',
    align: 'left',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const districts = computed(() => store.districts);

//Watch store.cToEdit to open/close dialog automatically
watch(
  () => store.districtToEdit,
  (newVal) => {
    dialogOpen.value = !!newVal;
  },
);

// Watch for search changes
// watch(
//   () => store.search,
//   async () => {
//     pagination.value.page = 1;
//     await store.fetchDegrees(1, pagination.value.rowsPerPage);
//     pagination.value.rowsNumber = store.total;
//   },
// );

// Sync pagination with store
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
  await store.fetchDistricts({ page, perPage: rowsPerPage });
  pagination.value.rowsNumber = store.total;
};

const onEdit = (row: District) => store.setDistrictToEdit(row);

const onDelete = (row: District) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${row.name}"?`,
    cancel: true,
    persistent: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  })
    .onOk(() => {
      void (async () => {
        try {
          await store.deleteDistrict(row.id);

          $q.notify({
            color: 'positive',
            position: 'top',
            icon: 'warning',
            message: 'District deleted successfully.',
          });
        } catch (error) {
          console.error(error);
          $q.notify({
            color: 'negative',
            position: 'top',
            icon: 'error',
            message: 'Failed to delete District.',
          });
        }
      })();
    })
    .onCancel(() => {});
};

onMounted(async () => {
  await store.fetchDistricts({ page: 1, perPage: pagination.value.rowsPerPage });
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
