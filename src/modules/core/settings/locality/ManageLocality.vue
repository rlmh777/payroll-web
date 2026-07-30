<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <!-- Search -->
      <SearchLocality v-model:modelValue="store.search" />
      <q-card-section class="q-pa-none">
        <q-table
          title="Localities"
          :rows="localities"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20]"
          server-side
          @request="onRequest"
          no-data-label="No Localities"
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
                  <q-tooltip>Edit Locality</q-tooltip>
                </q-btn>
                <!-- <q-btn
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  size="sm"
                  class="action-btn"
                  @click="onDelete(props.row)"
                >
                  <q-tooltip>Delete Locality</q-tooltip>
                </q-btn> -->
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <!-- Update Locality Dialog -->
    <EditLocality v-model="dialogOpen" />
  </q-page>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { type QTableProps } from 'quasar';
import { useLocalityStore } from '../../stores/locality-store';
import SearchLocality from './SearchLocality.vue';
import type { Locality } from '@core/types/models';
import EditLocality from '@core/components/shared/locality/EditLocality.vue';

const store = useLocalityStore();
const dialogOpen = ref(false);

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: store.total,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'district',
    label: 'District',
    field: (row) => row.district?.name ?? '',
    align: 'left',
    sortable: true,
  },
  {
    name: 'country',
    label: 'Country',
    field: (row) => row.district?.country?.name ?? '',
    align: 'left',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const localities = computed(() => store.localities);

//Watch store.cToEdit to open/close dialog automatically
watch(
  () => store.localityToEdit,
  (newVal) => {
    dialogOpen.value = !!newVal;
  },
);

// Watch for search changes
watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await store.fetchLocalities({ page: 1, perPage: pagination.value.rowsPerPage });
    pagination.value.rowsNumber = store.total;
  },
);

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
  await store.fetchLocalities({ page, perPage: rowsPerPage });
  pagination.value.rowsNumber = store.total;
};

const onEdit = (row: Locality) => store.setLocalityToEdit(row);

// const onDelete = (row: Locality) => {
//   $q.dialog({
//     title: 'Confirm Delete',
//     message: `Are you sure you want to delete "${row.name}"?`,
//     cancel: true,
//     persistent: true,
//     ok: {
//       label: 'Delete',
//       color: 'negative',
//     },
//   })
//     .onOk(() => {
//       void (async () => {
//         try {
//           await store.deleteLocality(row.id);

//           $q.notify({
//             color: 'positive',
//             position: 'top',
//             icon: 'warning',
//             message: 'Locality deleted successfully.',
//           });
//         } catch (error) {
//           console.error(error);
//           $q.notify({
//             color: 'negative',
//             position: 'top',
//             icon: 'error',
//             message: 'Failed to delete Locality.',
//           });
//         }
//       })();
//     })
//     .onCancel(() => {});
// };

onMounted(async () => {
  await store.fetchLocalities({ page: 1, perPage: pagination.value.rowsPerPage });
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
