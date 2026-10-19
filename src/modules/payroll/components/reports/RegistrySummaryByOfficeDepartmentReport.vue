<template>
  <div class="registry-summary-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Registry Summary By Office &amp; Department Report</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Posted payroll summarized by office and department. Choose a date range or one payroll.
      S.S EE is the employee contribution and S.S ER is the employer contribution.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report filters</div>
        <div class="row q-col-gutter-md items-end">
          <div class="col-12">
            <q-option-group v-model="period" :options="periodOptions" color="primary" dense inline />
          </div>
          <template v-if="period === 'payroll_run'">
            <div class="col-12 col-md-4">
              <PayPeriodGroupSelect
                v-model="selectedPayPeriodGroupId"
                label="Pay period group"
                :clearable="false"
                :show-add-new="false"
                :show-edit="false"
                :disable="reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
              />
            </div>
            <div class="col-12 col-md-4">
              <q-select
                v-model="selectedPayrollRunId"
                outlined
                dense
                emit-value
                map-options
                label="Payroll"
                :loading="isLoadingPayRunSetup"
                :options="payrollRunOptions"
                :disable="!selectedPayPeriodGroupId || reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
              />
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-3">
              <DateField
                v-model="startDate"
                label="Start date"
                required
                :disable="reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
              />
            </div>
            <div class="col-12 col-md-3">
              <DateField
                v-model="endDate"
                label="End date"
                required
                :disable="reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
              />
            </div>
          </template>
          <div class="col-12 col-md-4">
            <ReportHeaderSelect />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="text-subtitle1 text-weight-bold">{{ report.title }}</div>
            <div class="text-body2 text-grey-7">Date Range: {{ report.periodLabel }}</div>
          </div>
          <div class="col-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              class="q-mr-sm"
              :disable="!report.rows.length"
              @click="handleExportExcel"
            />
            <q-btn
              outline
              color="primary"
              icon="picture_as_pdf"
              label="Export PDF"
              :disable="!report.rows.length"
              @click="handleExportPdf"
            />
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No posted payroll was found for the selected period.
        </q-banner>

        <q-table
          v-else
          class="registry-summary-report__table"
          :rows="report.rows"
          :columns="columns"
          :row-key="rowKey"
          flat
          bordered
          dense
          :pagination="{ rowsPerPage: 50 }"
          :loading="reportsStore.isLoadingRegistrySummaryByOfficeDepartment"
        >
          <template #body-cell="props">
            <q-td :props="props" :class="{ 'text-right': isMoneyColumn(props.col.name) }">
              {{ displayCell(props.col.name, props.value) }}
            </q-td>
          </template>
          <template #bottom-row>
            <q-tr class="registry-summary-report__totals-row">
              <q-td class="text-weight-bold">Totals</q-td>
              <q-td />
              <q-td />
              <q-td />
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.wage) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.overtime) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.pretaxDeduction) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.sickLeaveDeduction) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.otherEarnings) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.grossPay) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.taxes) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.ssEmployee) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.ssEmployer) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.postTaxDeduction) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.nonTaxPayout) }}</q-td>
              <q-td class="text-right text-weight-bold">{{ formatMoney(report.totals.netSalary) }}</q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type RegistrySummaryByOfficeDepartmentRow,
  type RegistrySummaryPeriod,
} from '@payroll/stores/reports-store';
import {
  exportRegistrySummaryByOfficeDepartmentExcel,
  exportRegistrySummaryByOfficeDepartmentPdf,
} from '@payroll/utils/registry-summary-by-office-department-export';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();
const { registrySummaryByOfficeDepartmentReport: report } = storeToRefs(reportsStore);
const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);

const period = ref<RegistrySummaryPeriod>('dates');
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);

const periodOptions = [
  { label: 'Dates', value: 'dates' },
  { label: 'Payroll', value: 'payroll_run' },
];

const moneyColumns = new Set([
  'wage',
  'overtime',
  'pretaxDeduction',
  'sickLeaveDeduction',
  'otherEarnings',
  'grossPay',
  'taxes',
  'ssEmployee',
  'ssEmployer',
  'postTaxDeduction',
  'nonTaxPayout',
  'netSalary',
]);

const columns: QTableProps['columns'] = [
  { name: 'payrollNumber', label: 'Payroll #', field: 'payrollNumber', align: 'left', sortable: true },
  { name: 'branch', label: 'Branch', field: 'branch', align: 'left', sortable: true },
  { name: 'department', label: 'Department', field: 'department', align: 'left', sortable: true },
  { name: 'processType', label: 'Process Type', field: 'processType', align: 'left' },
  { name: 'wage', label: 'Wage', field: 'wage', align: 'right', sortable: true },
  { name: 'overtime', label: 'Overtime', field: 'overtime', align: 'right', sortable: true },
  { name: 'pretaxDeduction', label: 'PreTax Deduction', field: 'pretaxDeduction', align: 'right' },
  { name: 'sickLeaveDeduction', label: 'Sick Leave Deduction', field: 'sickLeaveDeduction', align: 'right' },
  { name: 'otherEarnings', label: 'Other Earnings', field: 'otherEarnings', align: 'right' },
  { name: 'grossPay', label: 'Gross Pay', field: 'grossPay', align: 'right', sortable: true },
  { name: 'taxes', label: 'Taxes', field: 'taxes', align: 'right' },
  { name: 'ssEmployee', label: 'S.S EE', field: 'ssEmployee', align: 'right' },
  { name: 'ssEmployer', label: 'S.S ER', field: 'ssEmployer', align: 'right' },
  { name: 'postTaxDeduction', label: 'Post Tax Ded.', field: 'postTaxDeduction', align: 'right' },
  { name: 'nonTaxPayout', label: 'Non Tax Payout', field: 'nonTaxPayout', align: 'right' },
  { name: 'netSalary', label: 'Net Salary', field: 'netSalary', align: 'right', sortable: true },
];

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const payrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => (run.status ?? '').toLowerCase() === 'posted')
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;
      const payrollLabel = run.payrollNumber ? `Payroll #${run.payrollNumber}` : 'Processed';
      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : payrollLabel,
        caption: payrollLabel,
      };
    }),
);

const canGenerate = computed(() => {
  if (reportsStore.isLoadingRegistrySummaryByOfficeDepartment) return false;
  if (period.value === 'payroll_run') return Boolean(selectedPayrollRunId.value);
  return Boolean(startDate.value && endDate.value && startDate.value <= endDate.value);
});

function isMoneyColumn(name: string): boolean {
  return moneyColumns.has(name);
}

function displayCell(name: string, value: string | number | null): string {
  if (isMoneyColumn(name)) return formatMoney(Number(value ?? 0));
  if (name === 'payrollNumber') return value ? String(value) : '—';
  return value ? String(value) : '—';
}

function rowKey(row: RegistrySummaryByOfficeDepartmentRow): string {
  return `${row.payrollRunId}-${row.departmentId ?? 'none'}`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(1);
  return toIsoDate(date);
}

function defaultEndDate(): string {
  return toIsoDate(new Date());
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

async function generateReport() {
  if (!canGenerate.value) return;
  const ok = await reportsStore.fetchRegistrySummaryByOfficeDepartmentReport({
    period: period.value,
    payrollRunId: selectedPayrollRunId.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to generate the registry summary.',
      position: 'top',
    });
  }
}

function handleExportExcel() {
  if (!report.value) return;
  exportRegistrySummaryByOfficeDepartmentExcel(report.value);
  $q.notify({ type: 'positive', message: 'Registry summary exported to Excel.', position: 'top' });
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportRegistrySummaryByOfficeDepartmentPdf(report.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.', position: 'top' });
  }
}

watch(period, () => {
  reportsStore.clearRegistrySummaryByOfficeDepartmentReport();
});

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

onMounted(async () => {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

onUnmounted(() => {
  reportsStore.clearRegistrySummaryByOfficeDepartmentReport();
});
</script>

<style scoped>
.registry-summary-report__table {
  max-width: 100%;
}

.registry-summary-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
