<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">Payroll other payments</div>
        <div class="text-caption text-grey-7">
          Add or update employee other payments for the upcoming payroll run only.
        </div>
      </div>
      <div class="row q-gutter-sm">
        <q-btn
          outline
          color="primary"
          icon="upload_file"
          label="Import"
          no-caps
          :disable="!store.selectedPayrollRunId || store.draftRuns.length === 0"
          @click="showImport = true"
        />
        <q-btn
          color="primary"
          icon="add"
          label="Add other payment"
          unelevated
          no-caps
          :disable="!store.selectedPayrollRunId || store.draftRuns.length === 0"
          @click="openCreate"
        />
      </div>
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
          use-input
          input-debounce="0"
          clearable
          outlined
          dense
          label="Employee"
          @filter="filterEmployees"
          @update:model-value="refreshList"
        />
      </div>
      <div class="col-12 col-md-3">
        <q-input
          v-model="store.search"
          outlined
          dense
          clearable
          label="Search note / other payment"
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
      No upcoming payroll run is available. Processed payrolls cannot receive new other payments.
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
      <template #body-cell-date="props">
        <q-td :props="props">
          {{ formatDate(props.row.allowanceDate ?? props.row.allowance_date) }}
        </q-td>
      </template>
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

    <PayrollAllowanceImportDialog
      v-model="showImport"
      :payroll-run-id="store.selectedPayrollRunId"
      :employees="store.employees"
      :preview-import="previewImport"
      :confirm-import-rows="confirmImport"
      :is-working="store.isImporting"
      @imported="onImported"
    />

    <PayrollAllowanceFormDialog
      v-model="showForm"
      :record="editingRecord"
      :payroll-run-id="store.selectedPayrollRunId"
      :pay-period-start="selectedPayPeriodStart"
      :pay-period-end="selectedPayPeriodEnd"
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
  type PayrollAllowanceEmployeeOption,
  type PayrollAllowanceImportPreview,
} from '@payroll/stores/payroll-allowance-store';
import type { PayrollAllowanceImportRow } from '@payroll/utils/payroll-allowance-import';
import PayrollAllowanceFormDialog from '@payroll/components/payroll/PayrollAllowanceFormDialog.vue';
import PayrollAllowanceImportDialog from '@payroll/components/payroll/PayrollAllowanceImportDialog.vue';

const $q = useQuasar();
const store = usePayrollAllowanceStore();

const showForm = ref(false);
const showImport = ref(false);
const editingRecord = ref<HistoricalEmployeeAllowance | null>(null);
const employeeFilterOptions = ref<PayrollAllowanceEmployeeOption[]>([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const columns = [
  { name: 'date', label: 'Date', field: 'allowanceDate', align: 'left' as const },
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' as const },
  { name: 'allowance', label: 'Other Payment', field: 'allowance', align: 'left' as const },
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
    const range = [
      schedule?.startDate ?? schedule?.start_date,
      schedule?.endDate ?? schedule?.end_date,
    ].filter(Boolean).join(' → ');
    return {
      value: run.id,
      label: range ? `${groupName}: ${range}` : `${groupName} (${run.id.slice(0, 8)})`,
    };
  }),
);

const selectedPayPeriodStart = computed(() => {
  const schedule = store.selectedPayrollRun?.payPeriodSchedule;
  return schedule?.startDate ?? schedule?.start_date ?? null;
});

const selectedPayPeriodEnd = computed(() => {
  const schedule = store.selectedPayrollRun?.payPeriodSchedule;
  return schedule?.endDate ?? schedule?.end_date ?? null;
});

const matchEmployeesByName = (
  employees: PayrollAllowanceEmployeeOption[],
  val: string,
): PayrollAllowanceEmployeeOption[] => {
  const needle = val.trim().toLowerCase();
  if (!needle) return [...employees];

  return employees.filter((employee) => {
    const firstName = (employee.firstName ?? '').toLowerCase();
    const lastName = (employee.lastName ?? '').toLowerCase();
    const displayName = (employee.displayName ?? '').toLowerCase();
    const code = (employee.code ?? '').toLowerCase();
    const fullName = `${firstName} ${lastName}`.trim();
    const reverseName = `${lastName} ${firstName}`.trim();

    return (
      displayName.includes(needle)
      || fullName.includes(needle)
      || reverseName.includes(needle)
      || firstName.includes(needle)
      || lastName.includes(needle)
      || code.includes(needle)
    );
  });
};

const filterEmployees = (val: string, update: (fn: () => void) => void) => {
  update(() => {
    employeeFilterOptions.value = matchEmployeesByName(store.employees, val);
  });
};

watch(
  () => store.employees,
  (employees) => {
    employeeFilterOptions.value = [...employees];
  },
  { immediate: true },
);

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

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = value.slice(0, 10);
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${month}/${day}/${year}`;
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

const previewImport = (rows: PayrollAllowanceImportRow[]): Promise<PayrollAllowanceImportPreview | null> => {
  return store.previewImport(rows);
};

const confirmImport = (rows: PayrollAllowanceImportRow[]): Promise<boolean> => {
  return store.confirmImport(rows);
};

const onImported = () => {
  showImport.value = false;
  $q.notify({ type: 'positive', message: 'Payroll other payments imported' });
};

const handleSave = async (payload: {
  employeeId: string;
  allowanceId: string;
  accountId: string;
  payrollRunId: string;
  quantity: number;
  unitAmount: number;
  allowanceDate: string;
  note?: string;
}) => {
  try {
    if (editingRecord.value?.id) {
      await store.updateAllowance(editingRecord.value.id, payload);
      $q.notify({ type: 'positive', message: 'Other Payment updated' });
    } else {
      await store.createAllowance(payload);
      $q.notify({ type: 'positive', message: 'Other Payment added' });
    }
    showForm.value = false;
    editingRecord.value = null;
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'Save failed' });
  }
};

const confirmDelete = (row: HistoricalEmployeeAllowance) => {
  $q.dialog({
    title: 'Delete other payment',
    message: 'Remove this other payment from the upcoming payroll run?',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteAllowance(row.id);
        $q.notify({ type: 'positive', message: 'Other Payment deleted' });
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
