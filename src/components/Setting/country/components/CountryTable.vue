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

    <AddUpdateCountry
      v-model="dialogOpen"
      :country-to-edit="editingCountry"
      @saved="onCountrySaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { type QTableProps } from 'quasar';
import type { Country } from '../../../../components/models';
import { useCountryStore } from '../../../../stores/country-store';
import AddUpdateCountry from './AddUpdateCountry.vue';
import SearchCountry from './SearchCountry.vue';
const store = useCountryStore();

const dialogOpen = ref(false);
const editingCountry = ref<Partial<Country> | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: store.total,
  rowsNumber: store.total,
  sortBy: 'name',
  descending: false,
});

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const, sortable: true },
  { name: 'code1', label: 'Code 1', field: 'code1', align: 'left' as const, sortable: true },
  { name: 'code2', label: 'Code 2', field: 'code2', align: 'left' as const, sortable: true },
  {
    name: 'nationalityName',
    label: 'Nationality Name',
    field: 'nationalityName',
    align: 'center' as const,
    sortable: true,
  },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const, sortable: false },
];

const countries = computed(() => store.countries);
// const filter = computed(() => store.search); // The search is now in the store

// 1. Watch for search filter changes and refetch (reset to page 1)
watch(
  () => store.search,
  async () => {
    // Only refetch if search filter changes
    pagination.value.page = 1;
    await store.fetchCountries(1, pagination.value.rowsPerPage);
    pagination.value.rowsNumber = store.total;
  },
);

// 2. Sync pagination with store (after fetch completes)
watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  },
);

const onRequest = async (props: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
  filter?: string; // The filter is now handled by the watch on store.search
}) => {
  const { page, rowsPerPage } = props.pagination;

  // Update local pagination
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;

  // Fetch data from server - relying on store.search for filter
  await store.fetchCountries(page, rowsPerPage);

  // Update rowsNumber after fetch (will also be handled by the watch above, but good to be explicit)
  pagination.value.rowsNumber = store.total;
};

const openNew = () => {
  editingCountry.value = { name: '', code1: '', code2: '', nationalityName: '' };
  dialogOpen.value = true;
};

const onEdit = (row: Country) => {
  editingCountry.value = { ...row };
  dialogOpen.value = true;
};

const onCountrySaved = async () => {
  // Refresh the list after a country is added or updated (keep current page)
  await store.fetchCountries(pagination.value.page, pagination.value.rowsPerPage);
};

onMounted(async () => {
  // Start with page 1 and default rows per page
  await store.fetchCountries(1, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total; // Initial rowsNumber set
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
