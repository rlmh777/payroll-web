<template>
  <div class="td4-supplementary">
    <div class="text-h5 text-weight-bold q-mb-xs">Employee TD4 Supplementary</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      One A6 statement of emoluments paid for each employee with posted payroll in the selected dates.
      Limit the slips to the whole company, one department, or one employee, and choose the order they print in.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report filters</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-3">
            <DateField
              v-model="startDate"
              label="Start date"
              required
              :disable="reportsStore.isLoadingTd4Supplementary"
            />
          </div>
          <div class="col-12 col-md-3">
            <DateField
              v-model="endDate"
              label="End date"
              required
              :disable="reportsStore.isLoadingTd4Supplementary"
            />
          </div>
          <div class="col-12">
            <q-option-group v-model="scope" :options="scopeOptions" color="primary" dense inline />
          </div>
          <div v-if="scope === 'department'" class="col-12 col-md-4">
            <ParentDepartmentSelect
              v-model="departmentId"
              label="Department"
              outlined
              dense
              clearable
              :disable="reportsStore.isLoadingTd4Supplementary"
            />
          </div>
          <div v-if="scope === 'employee'" class="col-12 col-md-4">
            <EmployeeSelect
              v-model="employeeId"
              label="Employee"
              clearable
              :disable="reportsStore.isLoadingTd4Supplementary"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="sortBy"
              :options="sortOptions"
              outlined
              dense
              emit-value
              map-options
              multiple
              use-chips
              label="Sort by"
              hint="Slips print in the order of the columns you select"
              :disable="reportsStore.isLoadingTd4Supplementary"
            />
          </div>
          <div class="col-12 col-md-4">
            <ReportHeaderSelect />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="reportsStore.isLoadingTd4Supplementary"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-mb-md">
          <div class="col text-body2 text-grey-8">
            {{ report.scopeLabel }} · {{ report.periodLabel }} ·
            {{ report.employeeCount }} employee slip{{ report.employeeCount === 1 ? '' : 's' }}
          </div>
          <div class="col-auto">
            <q-btn
              outline
              color="primary"
              icon="print"
              label="Print A6"
              :disable="!report.slips.length"
              @click="handlePrint"
            />
          </div>
        </div>

        <div v-if="report.slips.length" class="td4-preview" v-html="markup" />
        <div v-else class="text-body2 text-grey-7">No posted payroll for the selected dates.</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import {
  useReportsStore,
  type Td4SupplementaryScope,
  type Td4SupplementarySortKey,
} from '@payroll/stores/reports-store';
import { printTd4Supplementary, td4SupplementaryMarkup } from '@payroll/utils/td4-supplementary-form';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { td4SupplementaryReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<Td4SupplementaryScope>('company');
const departmentId = ref<number | null>(null);
const employeeId = ref<string | null>(null);
const sortBy = ref<Td4SupplementarySortKey[]>(['lastName', 'firstName']);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
  { label: 'Employee', value: 'employee' },
];

const sortOptions = [
  { label: 'Last name', value: 'lastName' },
  { label: 'First name', value: 'firstName' },
  { label: 'Department', value: 'department' },
  { label: 'Social security', value: 'socialSecurity' },
  { label: 'Employee TIN', value: 'employeeTin' },
  { label: 'No. of weeks', value: 'weeks' },
  { label: 'Total income', value: 'totalIncome' },
  { label: 'Taxable income', value: 'taxableIncome' },
  { label: 'Non-taxable income', value: 'nonTaxableIncome' },
  { label: 'Commissions', value: 'commissions' },
  { label: 'Tax deducted', value: 'taxDeducted' },
];

const markup = computed(() => (report.value ? td4SupplementaryMarkup(report.value) : ''));

const canGenerate = computed(() => {
  if (!startDate.value || !endDate.value || startDate.value > endDate.value) {
    return false;
  }
  if (scope.value === 'department') {
    return departmentId.value != null;
  }
  if (scope.value === 'employee') {
    return Boolean(employeeId.value);
  }
  return true;
});

function defaultStartDate(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/01`;
}

function defaultEndDate(): string {
  const now = new Date();
  return `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}/${String(now.getDate()).padStart(2, '0')}`;
}

function generateReport() {
  if (!startDate.value || !endDate.value) return;
  void reportsStore.fetchTd4SupplementaryReport({
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    employeeId: employeeId.value,
    sortBy: sortBy.value,
  }).then((ok) => {
    if (!ok && reportsStore.error) {
      $q.notify({ type: 'negative', message: reportsStore.error });
    }
  });
}

function handlePrint() {
  if (!report.value) return;
  if (!printTd4Supplementary(report.value)) {
    $q.notify({ type: 'warning', message: 'Allow pop-ups to print the A6 slips.' });
  }
}
</script>

<style scoped>
.td4-preview {
  background: #f3f4f6;
  padding: 16px 8px;
  overflow: auto;
}
</style>
