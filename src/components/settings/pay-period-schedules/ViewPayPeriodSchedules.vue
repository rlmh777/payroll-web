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
      server-side
    >
      <template v-slot:body-cell-start_date="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-end_date="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-pay_date="props">
        <q-td :props="props">
          {{ formatDate(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-payrate_frequency="props">
        <q-td :props="props">
          {{ props.value?.name || '-' }}
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
              <q-tooltip>Edit Schedule</q-tooltip>
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
              <q-tooltip>Delete Schedule</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this pay period schedule? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="payPeriodScheduleStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePayPeriodScheduleStore, type PayPeriodSchedule } from '../../../stores/pay-period-schedule-store';

const props = defineProps<{
  payPeriodGroupId: string | null;
}>();

const emit = defineEmits<{
  edit: [schedule: PayPeriodSchedule];
}>();

const $q = useQuasar();
const payPeriodScheduleStore = usePayPeriodScheduleStore();

const columns = [
  {
    name: 'start_date',
    label: 'Start Date',
    field: 'start_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'end_date',
    label: 'End Date',
    field: 'end_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'pay_date',
    label: 'Pay Date',
    field: 'pay_date',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'payrate_frequency',
    label: 'Pay Rate Frequency',
    field: (row: PayPeriodSchedule) => row.payrate_frequency,
    align: 'left' as const,
    sortable: false,
  },
  {
    name: 'actions',
    label: '',
    field: '',
    align: 'right' as const,
    sortable: false,
  },
];

const rows = computed(() => payPeriodScheduleStore.payPeriodSchedules);
const loading = computed(() => payPeriodScheduleStore.isLoadingPayPeriodSchedules);
const showDeleteDialog = ref(false);
const recordToDelete = ref<PayPeriodSchedule | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Watch for payPeriodGroupId changes and refetch
watch(
  () => props.payPeriodGroupId,
  async (newGroupId) => {
    payPeriodScheduleStore.setPayPeriodGroupId(newGroupId);
    payPeriodScheduleStore.currentPage = 1;
    if (newGroupId) {
      await payPeriodScheduleStore.fetchPayPeriodSchedules(1, pagination.value.rowsPerPage, newGroupId);
    } else {
      payPeriodScheduleStore.payPeriodSchedules = [];
    }
  },
  { immediate: true }
);

// Sync pagination with store (after fetch completes)
watch(
  () => [payPeriodScheduleStore.currentPage, payPeriodScheduleStore.total],
  () => {
    pagination.value.page = payPeriodScheduleStore.currentPage;
    pagination.value.rowsNumber = payPeriodScheduleStore.total;
  }
);

const onRequest = async (requestProps: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
  filter?: string;
}) => {
  const { page, rowsPerPage } = requestProps.pagination;
  
  // Update local pagination
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  
  // Fetch data from store
  await payPeriodScheduleStore.fetchPayPeriodSchedules(
    page,
    rowsPerPage,
    props.payPeriodGroupId
  );
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = payPeriodScheduleStore.total;
};

const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const openEditDialog = (record: PayPeriodSchedule) => {
  emit('edit', record);
};

const confirmDelete = (record: PayPeriodSchedule) => {
  recordToDelete.value = record;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!recordToDelete.value) return;

  const deletedId = recordToDelete.value.id;
  const success = await payPeriodScheduleStore.deletePayPeriodSchedule(deletedId);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Pay period schedule deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    recordToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await payPeriodScheduleStore.fetchPayPeriodSchedules(
      payPeriodScheduleStore.currentPage,
      pagination.value.rowsPerPage,
      props.payPeriodGroupId
    );
  } else {
    $q.notify({
      type: 'negative',
      message: payPeriodScheduleStore.error || 'Failed to delete pay period schedule',
      position: 'top',
    });
  }
};

onMounted(async () => {
  if (props.payPeriodGroupId) {
    await payPeriodScheduleStore.fetchPayPeriodSchedules(1, pagination.value.rowsPerPage, props.payPeriodGroupId);
  }
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
