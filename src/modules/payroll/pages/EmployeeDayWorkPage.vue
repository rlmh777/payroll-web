<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">Day / trip work</div>
        <div class="text-caption text-grey-7">
          Record units worked for daily-rate employees who do not clock in. Pay = units × daily rate.
        </div>
      </div>
      <q-btn
        color="primary"
        icon="add"
        label="Record work"
        unelevated
        no-caps
        :disable="store.employees.length === 0"
        @click="openCreate"
      />
    </div>

    <div class="row q-col-gutter-md q-mb-md items-end">
      <div class="col-12 col-md-3">
        <SsBenefitDateField
          :model-value="store.startDate"
          label="From"
          @update:model-value="onStartDateChanged"
        />
      </div>
      <div class="col-12 col-md-3">
        <SsBenefitDateField
          :model-value="store.endDate"
          label="To"
          @update:model-value="onEndDateChanged"
        />
      </div>
      <div class="col-12 col-md-4">
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
          :loading="store.isBootstrapping"
          @filter="filterEmployees"
          @update:model-value="refreshList"
        />
      </div>
    </div>

    <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
      {{ store.error }}
    </q-banner>

    <q-banner
      v-else-if="!store.isBootstrapping && store.employees.length === 0"
      class="bg-grey-2 text-grey-8 q-mb-md"
      rounded
    >
      No daily-rate employees are in your scope. Set an employee’s compensation method to
      <strong>Daily / trip rate</strong> first.
    </q-banner>

    <q-table
      flat
      bordered
      dense
      row-key="id"
      :rows="store.entries"
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
      <template #body-cell-units="props">
        <q-td :props="props">
          {{ props.row.units ?? '—' }}
        </q-td>
      </template>
      <template #body-cell-dailyRate="props">
        <q-td :props="props">
          {{ formatCurrency(props.row.dailyRate) }}
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

    <EmployeeDayWorkFormDialog
      v-model="showForm"
      :record="editingRecord"
      :employees="store.employees"
      :saving="store.isSaving"
      @save="handleSave"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useEmployeeDayWorkStore,
  type DayWorkEmployeeOption,
  type EmployeeDayWork,
} from '@payroll/stores/employee-day-work-store';
import EmployeeDayWorkFormDialog from '@payroll/components/payroll/EmployeeDayWorkFormDialog.vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';

const $q = useQuasar();
const store = useEmployeeDayWorkStore();

const showForm = ref(false);
const editingRecord = ref<EmployeeDayWork | null>(null);
const employeeFilterOptions = ref<DayWorkEmployeeOption[]>([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const columns = [
  { name: 'date', label: 'Date', field: 'date', align: 'left' as const },
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' as const },
  { name: 'units', label: 'Units', field: 'units', align: 'right' as const },
  { name: 'dailyRate', label: 'Daily rate', field: 'dailyRate', align: 'right' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'note', label: 'Note', field: 'note', align: 'left' as const },
  { name: 'actions', label: '', field: 'actions', align: 'right' as const },
];

const matchEmployeesByName = (
  employees: DayWorkEmployeeOption[],
  val: string,
): DayWorkEmployeeOption[] => {
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

const employeeLabel = (row: EmployeeDayWork) => {
  const employee = row.employee;
  if (!employee) {
    const option = store.employees.find((item) => item.id === row.employeeId);
    return option?.displayName || '—';
  }
  const name = `${employee.lastName ?? ''}, ${employee.firstName ?? ''}`.replace(/^,\s*|,\s*$/g, '').trim();
  return name || employee.code || 'Employee';
};

const refreshList = async () => {
  pagination.value.page = 1;
  await store.fetchEntries(1, pagination.value.rowsPerPage);
};

const onStartDateChanged = (value: string | null) => {
  store.startDate = value ?? '';
  void refreshList();
};

const onEndDateChanged = (value: string | null) => {
  store.endDate = value ?? '';
  void refreshList();
};

const onRequest: NonNullable<QTableProps['onRequest']> = (requestProps) => {
  const { page, rowsPerPage } = requestProps.pagination;
  pagination.value.page = page;
  pagination.value.rowsPerPage = rowsPerPage;
  void store.fetchEntries(page, rowsPerPage);
};

const openCreate = () => {
  editingRecord.value = null;
  showForm.value = true;
};

const openEdit = (row: EmployeeDayWork) => {
  editingRecord.value = row;
  showForm.value = true;
};

const handleSave = async (payload: {
  employeeId: string;
  date: string;
  units: number;
  dailyRate: number;
  note?: string;
}) => {
  try {
    if (editingRecord.value?.id) {
      await store.updateEntry(editingRecord.value.id, payload);
      $q.notify({ type: 'positive', message: 'Day / trip work updated' });
    } else {
      await store.createEntry(payload);
      $q.notify({ type: 'positive', message: 'Day / trip work recorded' });
    }
    showForm.value = false;
    editingRecord.value = null;
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'Save failed' });
  }
};

const confirmDelete = (row: EmployeeDayWork) => {
  $q.dialog({
    title: 'Delete day / trip work',
    message: 'Remove this work entry? It will no longer be included in payroll.',
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteEntry(row.id);
        $q.notify({ type: 'positive', message: 'Entry deleted' });
      } catch {
        $q.notify({ type: 'negative', message: store.error || 'Delete failed' });
      }
    })();
  });
};

onMounted(async () => {
  await store.bootstrap();
  await store.fetchEntries(1, pagination.value.rowsPerPage);
});
</script>
