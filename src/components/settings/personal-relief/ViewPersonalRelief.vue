<template>
  <div>
    <q-table
      class="my-sticky-dynamic q-mt-sm"
      flat
      bordered
      dense
      :rows="rows"
      :columns="columns"
      :loading="loading"
      row-key="id"
      v-model:pagination="pagination"
      :rows-per-page-options="[5, 10, 15, 20]"
      @request="onRequest"
      @row-click="onRowClick"
      server-side
    >
      <template v-slot:body-cell-startRange="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-endRange="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-personalRelief="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
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
              @click.stop="openEditDialog(props.row)"
            >
              <q-tooltip>Edit Record</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              icon="delete"
              color="negative"
              size="sm"
              class="action-btn"
              @click.stop="confirmDelete(props.row)"
            >
              <q-tooltip>Delete Record</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditPersonalRelief
      v-model="showEditDialog"
      :record="selectedRecord"
      @updated="onRecordUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this personal relief record? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="personalReliefStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePersonalReliefStore, type PersonalRelief } from '../../../stores/personal-relief-store';
import EditPersonalRelief from './EditPersonalRelief.vue';

const $q = useQuasar();
const personalReliefStore = usePersonalReliefStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => personalReliefStore.searchFilters,
  async () => {
    personalReliefStore.currentPage = 1;
    await personalReliefStore.fetchPersonalReliefs(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

const columns = [
  {
    name: 'startRange',
    label: 'Start Range',
    field: 'startRange',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'endRange',
    label: 'End Range',
    field: 'endRange',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'personalRelief',
    label: 'Personal Relief',
    field: 'personalRelief',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'right' as const,
    sortable: false,
  },
];

const rows = computed(() => personalReliefStore.personalReliefs);
const loading = computed(() => personalReliefStore.isLoadingPersonalReliefs);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedRecord = ref<PersonalRelief | null>(null);
const recordToDelete = ref<PersonalRelief | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [personalReliefStore.currentPage, personalReliefStore.total],
  () => {
    pagination.value.page = personalReliefStore.currentPage;
    pagination.value.rowsNumber = personalReliefStore.total;
  }
);

const onRequest = async (props: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
  filter?: string;
}) => {
  const { page, rowsPerPage } = props.pagination;
  
  // Update local pagination
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  
  // Fetch data from store
  await personalReliefStore.fetchPersonalReliefs(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = personalReliefStore.total;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (record: PersonalRelief) => {
  selectedRecord.value = record;
  showEditDialog.value = true;
};

const onRowClick = (_evt: Event, row: PersonalRelief) => {
  // Open edit dialog when row is clicked
  openEditDialog(row);
};

const onRecordUpdated = async () => {
  // Refresh the list after a record is updated (keep current page)
  await personalReliefStore.fetchPersonalReliefs(
    personalReliefStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (record: PersonalRelief) => {
  recordToDelete.value = record;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!recordToDelete.value) return;

  const success = await personalReliefStore.deletePersonalRelief(recordToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Personal relief record deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    recordToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await personalReliefStore.fetchPersonalReliefs(
      personalReliefStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: personalReliefStore.error || 'Failed to delete personal relief record',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch records with current search filters
  await personalReliefStore.fetchPersonalReliefs(1, pagination.value.rowsPerPage);
});
</script>

<style scoped>
.my-sticky-dynamic {
  max-height: 600px;
}

.action-buttons {
  display: flex;
  gap: 4px;
  justify-content: flex-end;
}

.action-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}

:deep(.q-table tbody tr) {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

:deep(.q-table tbody tr:hover) {
  background-color: rgba(0, 0, 0, 0.03);
}

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>

