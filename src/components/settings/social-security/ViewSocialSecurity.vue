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
      <template v-slot:body-cell-state="props">
        <q-td :props="props">
          <q-icon
            :name="props.value === 'active' ? 'check_circle' : 'cancel'"
            :color="props.value === 'active' ? 'positive' : 'negative'"
            size="sm"
          />
          {{ props.value === 'active' ? 'Active' : 'Inactive' }}
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyEarningsStartRange="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyEarningsEndRange="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyInsurableEarnings="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyEmployeeContributions="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyEmployerContributions="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-weekyEmployeeContributionsRate="props">
        <q-td :props="props" class="text-right">
          {{ props.value }}%
        </q-td>
      </template>
      <template v-slot:body-cell-weeklyEmployerContributionsRate="props">
        <q-td :props="props" class="text-right">
          {{ props.value }}%
        </q-td>
      </template>
      <template v-slot:body-cell-maxWeeklyShortTermBenefit="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-maxWeeklyPensions="props">
        <q-td :props="props" class="text-right">
          {{ formatCurrency(props.value) }}
        </q-td>
      </template>
      <template v-slot:body-cell-maxYearlyPension="props">
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
    <EditWeeklyRecord
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
          <span>Are you sure you want to delete this social security record? This action cannot be undone.</span>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn flat label="Delete" color="negative" @click="handleDelete" :loading="socialSecurityStore.isLoading" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSocialSecurityStore, type SocialSecurity } from '../../../stores/social-security-store';
import EditWeeklyRecord from './EditWeeklyRecord.vue';

const $q = useQuasar();
const socialSecurityStore = useSocialSecurityStore();

// Watch for search filter changes and refetch (reset to page 1)
watch(
  () => socialSecurityStore.searchFilters,
  async () => {
    socialSecurityStore.currentPage = 1;
    await socialSecurityStore.fetchSocialSecurities(1, pagination.value.rowsPerPage);
  },
  { deep: true }
);

const columns = [
  {
    name: 'weeklyEarningsStartRange',
    label: 'Start Range',
    field: 'weeklyEarningsStartRange',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weeklyEarningsEndRange',
    label: 'End Range',
    field: 'weeklyEarningsEndRange',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weeklyInsurableEarnings',
    label: 'Insurable Earnings',
    field: 'weeklyInsurableEarnings',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weeklyEmployeeContributions',
    label: 'Employee Contributions',
    field: 'weeklyEmployeeContributions',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weeklyEmployerContributions',
    label: 'Employer Contributions',
    field: 'weeklyEmployerContributions',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weekyEmployeeContributionsRate',
    label: 'Employee Rate %',
    field: 'weekyEmployeeContributionsRate',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'weeklyEmployerContributionsRate',
    label: 'Employer Rate %',
    field: 'weeklyEmployerContributionsRate',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'maxWeeklyShortTermBenefit',
    label: 'Max Short Term Benefit',
    field: 'maxWeeklyShortTermBenefit',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'maxWeeklyPensions',
    label: 'Max Weekly Pensions',
    field: 'maxWeeklyPensions',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'maxYearlyPension',
    label: 'Max Yearly Pension',
    field: 'maxYearlyPension',
    align: 'right' as const,
    sortable: true,
  },
  {
    name: 'state',
    label: 'State',
    field: 'state',
    align: 'center' as const,
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

const rows = computed(() => socialSecurityStore.socialSecurities);
const loading = computed(() => socialSecurityStore.isLoadingSocialSecurities);
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const selectedRecord = ref<SocialSecurity | null>(null);
const recordToDelete = ref<SocialSecurity | null>(null);

const pagination = ref({
  rowsPerPage: 10,
  page: 1,
  rowsNumber: 0,
});

// Sync pagination with store (after fetch completes)
watch(
  () => [socialSecurityStore.currentPage, socialSecurityStore.total],
  () => {
    pagination.value.page = socialSecurityStore.currentPage;
    pagination.value.rowsNumber = socialSecurityStore.total;
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
  await socialSecurityStore.fetchSocialSecurities(page, rowsPerPage);
  
  // Update rowsNumber after fetch
  pagination.value.rowsNumber = socialSecurityStore.total;
};

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

const openEditDialog = (record: SocialSecurity) => {
  selectedRecord.value = record;
  showEditDialog.value = true;
};

const onRowClick = (_evt: Event, row: SocialSecurity) => {
  // Open edit dialog when row is clicked
  openEditDialog(row);
};

const onRecordUpdated = async () => {
  // Refresh the list after a record is updated (keep current page)
  await socialSecurityStore.fetchSocialSecurities(
    socialSecurityStore.currentPage,
    pagination.value.rowsPerPage
  );
};

const confirmDelete = (record: SocialSecurity) => {
  recordToDelete.value = record;
  showDeleteDialog.value = true;
};

const handleDelete = async () => {
  if (!recordToDelete.value) return;

  const success = await socialSecurityStore.deleteSocialSecurity(recordToDelete.value.id);
  if (success) {
    $q.notify({
      type: 'positive',
      message: 'Social security record deleted successfully',
      position: 'top',
    });
    showDeleteDialog.value = false;
    recordToDelete.value = null;
    // Refresh the list after deletion (keep current page)
    await socialSecurityStore.fetchSocialSecurities(
      socialSecurityStore.currentPage,
      pagination.value.rowsPerPage
    );
  } else {
    $q.notify({
      type: 'negative',
      message: socialSecurityStore.error || 'Failed to delete social security record',
      position: 'top',
    });
  }
};

onMounted(async () => {
  // Fetch records with current search filters
  await socialSecurityStore.fetchSocialSecurities(1, pagination.value.rowsPerPage);
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

