<template>
  <div>
    <search-employee-leave />
    
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
      <template v-slot:body-cell-notes="props">
        <q-td :props="props">
          <div class="text-ellipsis" :title="props.value">
            {{ props.value || '-' }}
          </div>
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
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Edit Leave</q-tooltip>
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
              <q-tooltip>Delete Leave</q-tooltip>
            </q-btn>
          </div>
        </q-td>
      </template>
    </q-table>
    <EditEmployeeLeave
      v-model="showEditDialog"
      :employeeLeave="selectedEmployeeLeave"
      @updated="onEmployeeLeaveUpdated"
    />
    <q-dialog v-model="showDeleteDialog">
      <q-card>
        <q-card-section class="row items-center">
          <q-avatar icon="warning" color="negative" text-color="white" />
          <span class="q-ml-sm text-h6">Confirm Delete</span>
        </q-card-section>

        <q-card-section>
          <span>Are you sure you want to delete this leave record? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="employeeLeaveStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeLeaveStore } from '../../../stores/employee-leave-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import SearchEmployeeLeave from './SearchEmployeeLeave.vue';
import EditEmployeeLeave from './EditEmployeeLeave.vue';
import type { EmployeeLeave } from '../../models';

const $q = useQuasar();
const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => employeeLeaveStore.searchFilters,
  async () => {
    employeeLeaveStore.currentPage = 1;
    await employeeLeaveStore.fetchEmployeeLeaves(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

// Watch for selectedEmployee changes and refetch (reset to page 1)
watch(
  () => employeeStore.selectedEmployee?.id,
  async () => {
    employeeLeaveStore.currentPage = 1;
    await employeeLeaveStore.fetchEmployeeLeaves(1, pagination.value.rowsPerPage);
  }
);

const columns = [
  {
    name: 'leaveType',
    label: 'Leave Type',
    field: (row: EmployeeLeave) => row.leave_type?.name || '-',
    align: 'left' as const,
    sortable: true,
  },
  {
    name: 'startDate',
    label: 'Start Date',
    field: 'startDate',
    align: 'left' as const,
    sortable: true,
    format: (val: string) => {
      if (!val) return '-';
      return new Date(val).toLocaleDateString();
    },
  },
  {
    name: 'endDate',
    label: 'End Date',
    field: 'endDate',
    align: 'left' as const,
    sortable: true,
    format: (val: string) => {
      if (!val) return '-';
      return new Date(val).toLocaleDateString();
    },
  },
  {
    name: 'multiplier',
    label: 'Multiplier',
    field: 'multiplier',
    align: 'center' as const,
    sortable: true,
    format: (val: number) => val || 1.0,
  },
  {
    name: 'notes',
    label: 'Notes',
    field: 'notes',
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

const rows = computed(() => employeeLeaveStore.employeeLeaves);
const loading = computed(() => employeeLeaveStore.isLoadingEmployeeLeaves);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedEmployeeLeave = ref<EmployeeLeave | null>(null);
const employeeLeaveToDelete = ref<EmployeeLeave | null>(null);

const pagination = ref({
  rowsPerPage: 5,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [employeeLeaveStore.currentPage, employeeLeaveStore.total],
  () => {
    pagination.value.page = employeeLeaveStore.currentPage;
    pagination.value.rowsNumber = employeeLeaveStore.total;
  }
);

const onRequest = async (props: {
  pagination: { page: number; rowsPerPage: number; sortBy?: string; descending?: boolean };
  filter?: string;
}) => {
  console.log('onRequest event:', props);
  const { page, rowsPerPage } = props.pagination;
  
  // Update local pagination
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  
  // Fetch data from server
  await employeeLeaveStore.fetchEmployeeLeaves(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = employeeLeaveStore.total;
};

const openEditDialog = (employeeLeave: EmployeeLeave) => {
  selectedEmployeeLeave.value = employeeLeave;
  showEditDialog.value = true;
};

const onEmployeeLeaveUpdated = async () => {
  // Refresh the list after a leave is updated (keep current page)
  await employeeLeaveStore.fetchEmployeeLeaves(
    employeeLeaveStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (employeeLeave: EmployeeLeave) => {
  employeeLeaveToDelete.value = employeeLeave;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!employeeLeaveToDelete.value) return;

  const success = await employeeLeaveStore.deleteEmployeeLeave(employeeLeaveToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Leave record deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    employeeLeaveToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await employeeLeaveStore.fetchEmployeeLeaves(
      employeeLeaveStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: employeeLeaveStore.error || 'Failed to delete leave record',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch employee leaves with current search filters
  // employeeId will be taken from employeeStore.selectedEmployee
  // Start with page 1 and default rows per page
  await employeeLeaveStore.fetchEmployeeLeaves(1, pagination.value.rowsPerPage);
});
</script>

<style scoped>
.my-sticky-dynamic {
  max-height: 600px;
}

.text-ellipsis {
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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

:deep(.q-table tbody tr:hover .action-btn) {
  opacity: 1;
}
</style>

