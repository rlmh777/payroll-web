<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h6">Day / trip work</div>
        <div class="text-caption text-grey-7">
          Record trips for daily-rate employees, or for hourly and base employees who have a trip rate. A trip is only for a day they are not scheduled and have not clocked in. Pay = units × trip rate.
        </div>
      </div>
      <q-btn
        v-if="activeTab === 'entries'"
        color="primary"
        icon="add"
        label="Record work"
        unelevated
        no-caps
        :disable="store.employees.length === 0"
        @click="openCreate"
      />
    </div>

    <q-tabs v-model="activeTab" dense align="left" class="q-mb-md" active-color="primary" indicator-color="primary">
      <q-tab name="week" label="Week" no-caps />
      <q-tab name="entries" label="Entries" no-caps />
    </q-tabs>

    <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
      {{ store.error }}
    </q-banner>

    <q-banner
      v-else-if="!store.isBootstrapping && store.employees.length === 0"
      class="bg-grey-2 text-grey-8 q-mb-md"
      rounded
    >
      No employees with a trip rate are in your scope. Use Daily / trip rate, or set a trip rate on an hourly or base compensation.
    </q-banner>

    <q-tab-panels v-model="activeTab" animated keep-alive class="day-work-tabs">
      <q-tab-panel name="week" class="q-pa-none">
        <EmployeeDayWorkWeekBoard
          :employees="store.employees"
          :refresh-token="weekRefreshToken"
          @add="openCreateForDay"
          @edit="openEditFromWeek"
          @delete="confirmDelete"
        />
      </q-tab-panel>

      <q-tab-panel name="entries" class="q-pa-none">
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
      <template #body-cell-department="props">
        <q-td :props="props">
          {{ departmentLabel(props.row) }}
        </q-td>
      </template>
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
      </q-tab-panel>
    </q-tab-panels>

    <EmployeeDayWorkFormDialog
      v-model="showForm"
      :record="editingRecord"
      :employees="store.employees"
      :departments="store.departments"
      :saving="store.isSaving"
      :preset-employee-id="presetEmployeeId"
      :preset-date="presetDate"
      :lock-employee-and-date="lockEmployeeAndDate"
      @save="handleSave"
    />
  </q-page>
</template>

<style scoped>
.day-work-tabs {
  padding-bottom: 2.5rem;
  margin-bottom: 2rem;
}
</style>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useEmployeeDayWorkStore,
  type DayWorkEmployeeOption,
  type EmployeeDayWork,
} from '@payroll/stores/employee-day-work-store';
import EmployeeDayWorkFormDialog from '@payroll/components/payroll/EmployeeDayWorkFormDialog.vue';
import EmployeeDayWorkWeekBoard from '@payroll/components/payroll/EmployeeDayWorkWeekBoard.vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';

const $q = useQuasar();
const store = useEmployeeDayWorkStore();

const showForm = ref(false);
const editingRecord = ref<EmployeeDayWork | null>(null);
const activeTab = ref('week');
const weekRefreshToken = ref(0);
const presetEmployeeId = ref<string | null>(null);
const presetDate = ref<string | null>(null);
const lockEmployeeAndDate = ref(false);
const employeeFilterOptions = ref<DayWorkEmployeeOption[]>([]);

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const columns = [
  { name: 'date', label: 'Date', field: 'date', align: 'left' as const },
  { name: 'employee', label: 'Employee', field: 'employee', align: 'left' as const },
  { name: 'department', label: 'Department', field: 'department', align: 'left' as const },
  { name: 'units', label: 'Units', field: 'units', align: 'right' as const },
  { name: 'dailyRate', label: 'Daily rate', field: 'dailyRate', align: 'right' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'guest', label: 'Guest', field: 'guest', align: 'left' as const },
  { name: 'destination', label: 'Destination', field: 'destination', align: 'left' as const },
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

const departmentLabel = (row: EmployeeDayWork) => {
  if (row.department?.name) return row.department.name;
  const match = store.departments.find((department) => department.id === Number(row.departmentId));
  return match?.name || '—';
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
  presetEmployeeId.value = null;
  presetDate.value = null;
  lockEmployeeAndDate.value = false;
  showForm.value = true;
};

const openCreateForDay = (employeeId: string, day: string) => {
  editingRecord.value = null;
  presetEmployeeId.value = employeeId;
  presetDate.value = day;
  lockEmployeeAndDate.value = true;
  showForm.value = true;
};

const openEdit = (row: EmployeeDayWork) => {
  editingRecord.value = row;
  presetEmployeeId.value = null;
  presetDate.value = null;
  lockEmployeeAndDate.value = false;
  showForm.value = true;
};

const openEditFromWeek = (row: EmployeeDayWork) => {
  editingRecord.value = row;
  presetEmployeeId.value = null;
  presetDate.value = null;
  lockEmployeeAndDate.value = true;
  showForm.value = true;
};

const handleSave = async (payload: {
  employeeId: string;
  date: string;
  units: number;
  dailyRate: number;
  note?: string | null;
  guest?: string | null;
  destination?: string | null;
  departmentId: number;
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
    weekRefreshToken.value += 1;
  } catch {
    $q.notify({ type: 'negative', message: store.error || 'Save failed' });
  }
};

const confirmDelete = (row: EmployeeDayWork) => {
  $q.dialog({
    title: 'Delete day / trip work',
    message: 'Remove this work entry? It will no longer be included in payroll.',
    cancel: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteEntry(row.id);
        weekRefreshToken.value += 1;
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
