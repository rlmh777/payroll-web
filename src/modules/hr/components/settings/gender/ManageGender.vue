<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchGender />
      <q-card-section class="q-pa-none">
        <q-table
          title="Genders"
          :rows="genders"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingGenders"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 15, 20]"
          @request="onRequest"
          no-data-label="No genders"
        >
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
                  <q-tooltip>Edit Gender</q-tooltip>
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
                  <q-tooltip>Delete Gender</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <UpdateGender />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useGenderStore, type Gender } from '@core/stores/gender-store';
import SearchGender from './SearchGender.vue';
import UpdateGender from './UpdateGender.vue';

const store = useGenderStore();
const $q = useQuasar();

const pagination = ref({
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const genders = computed(() => store.genders);

watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await store.fetchGenders(1, pagination.value.rowsPerPage);
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
  await store.fetchGenders(page, rowsPerPage);
  pagination.value.rowsNumber = store.total;
};

const onEdit = (row: Gender) => store.setGenderToEdit(row);

const onDelete = (row: Gender) => {
  $q.dialog({
    title: 'Confirm Delete',
    message: `Are you sure you want to delete "${row.name}"?`,
    cancel: true,
    ok: {
      label: 'Delete',
      color: 'negative',
    },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteGender(row.id);
        pagination.value.rowsNumber = store.total;
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Gender deleted successfully.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Failed to delete gender.',
        });
      }
    })();
  });
};

onMounted(async () => {
  await store.fetchGenders(1, pagination.value.rowsPerPage);
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
