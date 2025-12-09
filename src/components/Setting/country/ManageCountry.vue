<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchCountry v-model:modelValue="store.search" @open-new="openNew" />
      <q-card-section class="q-pa-none">
        <q-table
          title="Countries"
          :rows="countries"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoadingCountries"
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
                  <q-tooltip>Edit Country</q-tooltip>
                </q-btn>
              </div>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
    <UpdateCountry v-model="dialogOpen" />
  </q-page>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { type QTableProps } from 'quasar';
import { useCountryStore, type Country } from '../../../stores/country-store';
import UpdateCountry from './UpdateCountry.vue';
import SearchCountry from './SearchCountry.vue';

const store = useCountryStore();
const dialogOpen = ref(false);

const pagination = ref({
  page: 1,
  rowsPerPage: store.total,
  rowsNumber: store.total,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'code1', label: 'Code 1', field: 'code1', align: 'left', sortable: true },
  { name: 'code2', label: 'Code 2', field: 'code2', align: 'left', sortable: true },
  {
    name: 'nationalityName',
    label: 'Nationality Name',
    field: 'nationalityName',
    align: 'center',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'right', sortable: false },
];

const countries = computed(() => store.countries);

// Watch store.countryToEdit to open/close dialog automatically
watch(
  () => store.countryToEdit,
  (newVal) => {
    dialogOpen.value = !!newVal;
  },
);

// Watch for search changes
watch(
  () => store.search,
  async () => {
    pagination.value.page = 1;
    await store.fetchCountries(1, pagination.value.rowsPerPage);
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
  await store.fetchCountries(page, rowsPerPage);
  pagination.value.rowsNumber = store.total;
};

const openNew = () =>
  store.setCountryToEdit({ name: '', code1: '', code2: '', nationalityName: '' } as Country);
const onEdit = (row: Country) => store.setCountryToEdit(row);

onMounted(async () => {
  await store.fetchCountries(1, pagination.value.rowsPerPage);
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
