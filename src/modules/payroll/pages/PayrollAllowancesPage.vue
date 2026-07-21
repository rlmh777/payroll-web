<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">Payroll allowances</div>
        <div class="text-caption text-grey-7">
          Add or update employee allowances for the upcoming draft payroll run.
        </div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Add allowance"
        unelevated
        no-caps
        :disable="!store.selectedPayrollRunId || store.draftRuns.length === 0"
        @click="openCreate"
      />
    </div>

    <div class="row q-col-gutter-md q-mb-md items-end">
      <div class="col-12 col-md-4">
        <q-select
          v-model="store.selectedPayrollRunId"
          :options="payrollRunOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="Upcoming payroll run"
          :loading="store.isBootstrapping"
          :disable="store.isBootstrapping"
          @update:model-value="onPayrollRunChanged"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-select
          v-model="store.selectedEmployeeId"
          :options="employeeFilterOptions"
          option-value="id"
          option-label="displayName"
          emit-value
          map-options
          clearable
          outlined
          dense
          label="Employee"
          @update:model-value="refreshList"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="store.search"
          outlined
          dense
          clearable
          label="Search note / allowance"
          @keyup.enter="refreshList"
          @clear="refreshList"
        >
          <template #append>
            <q-icon name="search" class="cursor-pointer" @click="refreshList" />
          </template>
        </q-input>
      </div>
    </div>

    <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
      {{ store.error }}
    </q-banner>

    <q-banner
      v-else-if="!store.isBootstrapping && store.draftRuns.length === 0"
      class="bg-grey-2 text-grey-8 q-mb-md"
      rounded
    >
      No draft payroll run is available. Create a payroll run first, then return here to enter allowances.
    </q-banner>

    <q-table
      flat
      bordered
      dense
      row-key="id"
      :rows="store.allowances"
      :columns="columns"
      :loading="store.isLoading || store.isBootstrapping"
      v-model:pagination="pagination"
      :rows-per-page-options="[10, 25, 50]"
      @request="onRequest"
    >
      <template #body-cell-employee="props">
        <q-td :props="props">
          {{ employeeLabel(props.row) }}
        </q-td>
      </template>
      <template #body-cell-allowance="props">
        <q-td :props="props">
          {{ props.row.allowance?.name || '—' }}
        </q-td>
      </template>
      <template #body-cell-account="props">
        <q-td :props="props">
          {{ props.row.chart_of_account?.name || '—' }}
        </q-td>
      </template>
      <template #body-cell-quantity="props">
        <q-td :props="props">
          {{ props.row.quantity ?? '—' }}
        </q-td>
      </template>
      <template #body-cell-unitAmount="props">
        <q-td :props="props">
          {{ formatCurrency(props.row.unitAmount) }}
        </q-td>
      </template>
      <template #body-cell-amount="props">
        <q-td :props="props">
          {{ formatCurrency(props.row.amount) }}
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat dense round icon="edit" color="primary" @click="openEdit(props.row)">
            <q-tooltip>Edit</q-tooltip>
          </q-btn>
          <q-btn flat dense round icon="delete" color="negative" @click="confirmDelete(props.row)">
            <q-tooltip>Delete</q-tooltip>
          </q-btn>
        </q-td>
      </template>
    </q-table>

    <PayrollAllowanceFormDialog
      v-model="showForm"
      :record="editingRecord"
      :payroll-run-id="store.selectedPayrollRunId"
      :employees="store.employees"
      :allowances="store.allowanceOptions"
      :accounts="store.accountOptions"
      :saving="store.isSaving"
      @save="handleSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  usePayrollAllowanceStore,
  type HistoricalEmployeeAllowance,
} from '@payroll/stores/payroll-allowance-store';
import PayrollAllowanceFormDialog from '@payroll/components/payroll/PayrollAllowanceFormDialog.vue';

const $q = useQuasar();
const store = usePayrollAllowanceStore();

const showForm = ref(false);
const editingRecord = ref<HistoricalEmployeeAllowance | null>(null);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const columns = [
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' as const },
  { name: 'allowance', label: 'Allowance', field: 'allowance', align: 'left' as const },
  { name: 'account', label: 'Account', field: 'account', align: 'left' as const },
  { name: 'quantity', label: 'Qty', field: 'quantity', align: 'right' as const },
  { name: 'unitAmount', label: 'Unit amount', field: 'unitAmount', align: 'right' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'note', label: 'Note', field: 'note', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

const payrollRunOptions = computed(() =>
  store.draftRuns.map((run) => {
    const schedule = run.payPeriodSchedule;
    const groupName = schedule?.payPeriodGroup?.name ?? 'Payroll';
    const range = [schedule?.startDate, schedule?.endDate].filter(Boolean).join(' → ');
    return {
      value: run.id,
      label: range ? `${groupName}: ${range}` : `${groupName} (${run.id.slice(0, 8)})`,
    };
  }),
);

const employeeFilterOptions = computed(() => store.employees);

watch(
  () => [store.currentPage, store.total],
  () => {
    pagination.value.page = store.currentPage;
    pagination.value.rowsNumber = store.total;
  },
);

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const employeeLabel = (row: HistoricalEmployeeAllowance) => {
  const employee = row.employee;
  if (!employee) return '—';
  const name = `${employee.lastName ?? ''}, ${employee.firstName ?? ''}`.replace(/^,\s*|,\s*$/g, '').trim();
  return name || employee.code || 'Employee';
};

const refreshList = async () => {
  pagination.value.page = 1;
  await store.fetchAllowances(1, pagination.value.rowsPerPage);
};

const onPayrollRunChanged = async () => {
  await refreshList();
};

const onRequest: NonNullable<QTableProps['onRequest']> = (requestProps) => {
  const { page, rowsPerPage } = requestProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  void store.fetchAllowances(page, rowsPerPage);
};

const openCreate = () => {
  editingRecord.value = null;
  showForm.value = true;
};

const openEdit = (row: HistoricalEmployeeAllowance) => {
  editingRecord.value = row;
  showForm.value = true;
};

const handleSave = async (payload: {
  employeeId: string;
  allowanceId: string;
  accountId: string;
  payrollRunId: string;
  quantity: number;
  unitAmount: number;
  note?: string;
}) => {
  try {
    if (editingRecord.value?.id) {
      await store.updateAllowance(editingRecord.value.id, payload);
      $q.notify({ type: 'positive', message: 'Allowance updated' });
    } else {
      await store.createAllowance(payload);
      $q.notify({ type: 'positive', message: 'Allowance added' });
    }
    showForm.value = false;
    editingRecord.value = null;
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'Save failed' });
  }
};

const confirmDelete = (row: HistoricalEmployeeAllowance) => {
  $q.dialog({
    title: 'Delete allowance',
    message: 'Remove this allowance from the upcoming payroll run?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteAllowance(row.id);
        $q.notify({ type: 'positive', message: 'Allowance deleted' });
      } catch {
        $q.notify({ type: 'negative', message: store.error || 'Delete failed' });
      }
    })();
  });
};

onMounted(async () => {
  await store.bootstrap();
  if (store.selectedPayrollRunId) {
    await store.fetchAllowances(1, pagination.value.rowsPerPage);
  }
});
</script>
