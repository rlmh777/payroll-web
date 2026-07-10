<template>
  <div class="generate-payslip-page q-pa-md">
    <div class="row items-start justify-between q-col-gutter-md q-mb-lg">
      <div class="col-12 col-sm">
        <div class="row items-center q-gutter-xs text-caption text-primary text-weight-medium q-mb-xs">
          <q-icon name="description" size="16px" />
          <span>Payroll</span>
        </div>
        <div class="text-h4 text-weight-bold">Generate Payslip</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Select a processed payroll run and generate payslips for all employees, a department, or a single employee.
        </div>
      </div>
    </div>

    <q-banner v-if="error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to complete the request</div>
      <div class="text-caption">{{ error }}</div>
    </q-banner>

    <q-card flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Payroll run selection</div>

        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <PayPeriodGroupSelect
              v-model="selectedPayPeriodGroupId"
              label="Pay period group"
              :clearable="false"
              :show-add-new="false"
              :show-edit="false"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedPayrollRunId"
              outlined
              emit-value
              map-options
              label="Processed payroll run"
              :loading="isLoadingPayRunSetup"
              :options="processedPayrollRunOptions"
              :disable="!selectedPayPeriodGroupId"
              :rules="[(value) => Boolean(value) || 'Select a processed payroll run']"
            >
              <template #prepend><q-icon name="task_alt" /></template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    No processed payroll runs found for this pay period group.
                  </q-item-section>
                </q-item>
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>

        <q-separator class="q-my-lg" />

        <div class="text-subtitle1 text-weight-bold q-mb-md">Payslip scope</div>

        <q-option-group
          v-model="generationScope"
          type="radio"
          color="primary"
          :options="generationScopeOptions"
          class="q-mb-md"
        />

        <div v-if="generationScope === 'all'" class="q-mb-md">
          <div class="text-subtitle2 text-weight-medium q-mb-sm">Sort order</div>
          <q-option-group
            v-model="payslipSort"
            type="radio"
            color="primary"
            :options="payslipSortOptions"
          />
        </div>

        <div v-else-if="generationScope === 'department'" class="q-mb-md" style="max-width: 480px;">
          <DepartmentSelect
            v-model="selectedDepartmentId"
            label="Department"
            clearable
            :rules="[(value: number | null) => Boolean(value) || 'Select a department']"
          />
        </div>

        <div v-else class="q-mb-md" style="max-width: 480px;">
          <EmployeeSelect
            v-model="selectedEmployeeId"
            label="Employee"
            clearable
            :rules="[(value) => Boolean(value) || 'Select an employee']"
          />
        </div>

        <div class="row q-gutter-sm q-mt-lg">
          <q-btn
            unelevated
            color="primary"
            icon="description"
            label="Generate payslips"
            :disable="!canGenerate"
            :loading="isGeneratingPayslips"
            @click="generatePayslips"
          />
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useQuasar } from 'quasar';
import PayPeriodGroupSelect from 'src/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import DepartmentSelect from 'src/components/department/DepartmentSelect.vue';
import EmployeeSelect from 'src/components/users/EmployeeSelect.vue';
import { formatDate } from 'src/components/attendance/utils';
import {
  useAttendanceStore,
  type PayslipSort,
} from 'src/stores/attendance-store';
import { usePayPeriodGroupStore } from 'src/stores/pay-period-group-store';

type GenerationScope = 'all' | 'department' | 'employee';

const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const $q = useQuasar();

const {
  payrollRuns,
  isLoadingPayPeriods,
  isLoadingPayrollRuns,
  isGeneratingPayslips,
  error,
} = storeToRefs(attendanceStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const generationScope = ref<GenerationScope>('all');
const payslipSort = ref<PayslipSort>('last_name');
const selectedEmployeeId = ref<string | null>(null);
const selectedDepartmentId = ref<number | null>(null);

const generationScopeOptions = [
  { label: 'All employees in payroll run', value: 'all' },
  { label: 'Department', value: 'department' },
  { label: 'Single employee', value: 'employee' },
];

const payslipSortOptions = [
  { label: 'Last name (A-Z)', value: 'last_name' },
  { label: 'Department, then last name (A-Z)', value: 'department_last_name' },
];

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const processedPayrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => run.status.toLowerCase() === 'posted')
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;

      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : 'Processed payroll run',
        caption: schedule?.payDate
          ? `Pay ${formatDate(schedule.payDate)} · Processed`
          : 'Processed',
      };
    }),
);

const canGenerate = computed(() => {
  if (!selectedPayrollRunId.value || isGeneratingPayslips.value) {
    return false;
  }

  if (generationScope.value === 'employee') {
    return Boolean(selectedEmployeeId.value);
  }

  if (generationScope.value === 'department') {
    return selectedDepartmentId.value !== null && selectedDepartmentId.value !== undefined;
  }

  return true;
});

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

async function loadPayrollSetup() {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(generationScope, (scope) => {
  if (scope === 'all') {
    selectedEmployeeId.value = null;
    selectedDepartmentId.value = null;
  } else if (scope === 'employee') {
    selectedDepartmentId.value = null;
  } else if (scope === 'department') {
    selectedEmployeeId.value = null;
  }
});

async function generatePayslips() {
  if (!canGenerate.value || !selectedPayrollRunId.value) {
    return;
  }

  const employeeId = generationScope.value === 'employee' ? selectedEmployeeId.value : null;
  const departmentId = generationScope.value === 'department' ? selectedDepartmentId.value : null;
  const sort = generationScope.value === 'department' ? 'last_name' : payslipSort.value;
  const opened = await attendanceStore.openPayrollRunPayslips(
    selectedPayrollRunId.value,
    sort,
    employeeId,
    departmentId,
  );

  if (!opened) {
    $q.notify({ type: 'negative', message: error.value ?? 'Failed to generate payslips.' });
    return;
  }

  $q.notify({ type: 'positive', message: 'Payslips opened in a new tab.' });
}

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>
