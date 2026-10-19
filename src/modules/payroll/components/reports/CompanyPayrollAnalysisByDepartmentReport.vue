<template>
  <div class="company-payroll-analysis-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Company Payroll Analysis by Department</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Regular, overtime, holiday, and vacation hours and pay by department for a payroll run or any date range.
      Totals are Regular + OT + Holiday + Vacation.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report period</div>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-option-group
              v-model="period"
              :options="periodOptions"
              color="primary"
              dense
              inline
            />
          </div>
          <template v-if="period === 'payroll_run'">
            <div class="col-12 col-md-6">
              <PayPeriodGroupSelect
                v-model="selectedPayPeriodGroupId"
                label="Pay period group"
                :clearable="false"
                :show-add-new="false"
                :show-edit="false"
                :disable="reportsStore.isLoadingCompanyPayrollAnalysisByDepartment"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="selectedPayrollRunId"
                outlined
                dense
                emit-value
                map-options
                label="Payroll run"
                :loading="isLoadingPayRunSetup"
                :options="payrollRunOptions"
                :disable="!selectedPayPeriodGroupId || reportsStore.isLoadingCompanyPayrollAnalysisByDepartment"
              >
                <template #option="optScope">
                  <q-item v-bind="optScope.itemProps">
                    <q-item-section>
                      <q-item-label>{{ optScope.opt.label }}</q-item-label>
                      <q-item-label v-if="optScope.opt.caption" caption>
                        {{ optScope.opt.caption }}
                      </q-item-label>
                    </q-item-section>
                  </q-item>
                </template>
                <template #no-option>
                  <q-item>
                    <q-item-section class="text-grey-7">
                      No payroll runs found for this pay period group.
                    </q-item-section>
                  </q-item>
                </template>
              </q-select>
            </div>
          </template>
          <template v-else>
            <div class="col-12 col-md-3">
              <DateField
                v-model="startDate"
                label="Start date"
                required
                :disable="reportsStore.isLoadingCompanyPayrollAnalysisByDepartment"
              />
            </div>
            <div class="col-12 col-md-3">
              <DateField
                v-model="endDate"
                label="End date"
                required
                :disable="reportsStore.isLoadingCompanyPayrollAnalysisByDepartment"
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
              :loading="reportsStore.isLoadingCompanyPayrollAnalysisByDepartment"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="company-payroll-analysis-report__heading q-mb-md">
          <div class="text-h6 text-weight-bold">{{ report.companyName }}</div>
          <div class="text-subtitle1">Company Payroll Analysis</div>
          <div class="text-subtitle2 text-grey-8">by Department</div>
        </div>

        <div class="row items-end q-col-gutter-md q-mb-md">
          <div class="col-auto">
            <table class="company-payroll-analysis-report__meta">
              <thead>
                <tr>
                  <th>Dates</th>
                  <th>Payroll #</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{{ formatDate(report.startDate) }} - {{ formatDate(report.endDate) }}</td>
                  <td>{{ report.payrollNumber ?? '—' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="col-grow"></div>
          <div class="col-auto">
            <q-banner rounded class="bg-blue-1 text-primary q-px-md q-py-sm">
              <div class="text-caption text-weight-medium">Employees</div>
              <div class="text-h5 text-weight-bold">{{ report.employeeCount }}</div>
            </q-banner>
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
          No department payroll data was found for the selected period.
        </q-banner>

        <div v-else class="company-payroll-analysis-report__table-wrap">
          <table class="company-payroll-analysis-report__table">
            <thead>
              <tr>
                <th rowspan="2">Dept</th>
                <th rowspan="2">#Employees</th>
                <th colspan="2">Regular</th>
                <th colspan="2">OT</th>
                <th colspan="2">Holiday</th>
                <th colspan="2">Vacation</th>
                <th colspan="2" class="company-payroll-analysis-report__total-head">TOTAL</th>
                <th rowspan="2" class="company-payroll-analysis-report__avg-head">Average Pay Per Hour</th>
              </tr>
              <tr>
                <th>Hours</th>
                <th>Pay</th>
                <th>Hours</th>
                <th>Pay</th>
                <th>Hours</th>
                <th>Pay</th>
                <th>Hours</th>
                <th>Pay</th>
                <th class="company-payroll-analysis-report__total-head">Hours</th>
                <th class="company-payroll-analysis-report__total-head">Pay</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.rows" :key="row.departmentId ?? 'unassigned'">
                <td>{{ row.departmentName }}</td>
                <td class="text-right">{{ row.employeeCount }}</td>
                <td class="text-right">{{ formatHours(row.regularHours) }}</td>
                <td class="text-right">{{ formatMoney(row.regularPay) }}</td>
                <td class="text-right">{{ formatHours(row.overtimeHours) }}</td>
                <td class="text-right">{{ formatMoney(row.overtimePay) }}</td>
                <td class="text-right">{{ formatHours(row.holidayHours) }}</td>
                <td class="text-right">{{ formatMoney(row.holidayPay) }}</td>
                <td class="text-right">{{ formatHours(row.vacationHours) }}</td>
                <td class="text-right">{{ formatMoney(row.vacationPay) }}</td>
                <td class="text-right text-weight-medium">{{ formatHours(row.totalHours) }}</td>
                <td class="text-right text-weight-medium">{{ formatMoney(row.totalPay) }}</td>
                <td class="text-right company-payroll-analysis-report__avg-cell">
                  {{ formatMoney(row.averagePayPerHour) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr class="company-payroll-analysis-report__totals-row">
                <td class="text-weight-bold">{{ report.totals.departmentName }}</td>
                <td class="text-right text-weight-bold company-payroll-analysis-report__avg-cell">
                  {{ report.totals.employeeCount }}
                </td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.regularHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatMoney(report.totals.regularPay) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.overtimeHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatMoney(report.totals.overtimePay) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.holidayHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatMoney(report.totals.holidayPay) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.vacationHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatMoney(report.totals.vacationPay) }}</td>
                <td class="text-right text-weight-bold">{{ formatHours(report.totals.totalHours) }}</td>
                <td class="text-right text-weight-bold">{{ formatMoney(report.totals.totalPay) }}</td>
                <td class="text-right text-weight-bold company-payroll-analysis-report__avg-cell">
                  {{ formatMoney(report.totals.averagePayPerHour) }}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import {
  useReportsStore,
  type CompanyPayrollAnalysisPeriod,
} from '@payroll/stores/reports-store';
import { exportCompanyPayrollAnalysisExcel, exportCompanyPayrollAnalysisPdf } from '@payroll/utils/company-payroll-analysis-export';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();
const { companyPayrollAnalysisByDepartmentReport: report } = storeToRefs(reportsStore);
const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);

const period = ref<CompanyPayrollAnalysisPeriod>('payroll_run');
const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);
const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);

const periodOptions = [
  { label: 'Payroll run', value: 'payroll_run' },
  { label: 'Custom dates', value: 'dates' },
];

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const payrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;
      const status = run.status ? run.status.charAt(0).toUpperCase() + run.status.slice(1).toLowerCase() : '';
      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : (run.payrollNumberFormatted || 'Payroll run'),
        caption: [run.payrollNumber != null ? `Payroll #${run.payrollNumber}` : null, status]
          .filter(Boolean)
          .join(' · '),
      };
    }),
);

const canGenerate = computed(() => {
  if (period.value === 'payroll_run') {
    return Boolean(selectedPayrollRunId.value);
  }
  return Boolean(startDate.value && endDate.value && startDate.value <= endDate.value);
});

function defaultStartDate(): string {
  const date = new Date();
  const day = date.getDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + mondayOffset);
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

function formatHours(value: number): string {
  return Number(value ?? 0).toLocaleString('en-US', { maximumFractionDigits: 2 });
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

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

watch(period, () => {
  reportsStore.clearCompanyPayrollAnalysisByDepartmentReport();
});

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});

async function generateReport() {
  if (!canGenerate.value) {
    return;
  }

  await reportsStore.fetchCompanyPayrollAnalysisByDepartmentReport({
    period: period.value,
    payrollRunId: selectedPayrollRunId.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
}

function handleExportExcel() {
  if (!report.value) {
    return;
  }
  exportCompanyPayrollAnalysisExcel(report.value);
  $q.notify({ type: 'positive', message: 'Company payroll analysis exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) {
    return;
  }
  const opened = exportCompanyPayrollAnalysisPdf(report.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = payrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.company-payroll-analysis-report__heading {
  text-align: center;
}

.company-payroll-analysis-report__meta {
  border-collapse: collapse;
  font-size: 13px;
}

.company-payroll-analysis-report__meta th,
.company-payroll-analysis-report__meta td {
  border: 1px solid #b0bec5;
  padding: 4px 10px;
}

.company-payroll-analysis-report__meta th {
  background: #eceff1;
}

.company-payroll-analysis-report__table-wrap {
  overflow-x: auto;
}

.company-payroll-analysis-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.company-payroll-analysis-report__table th,
.company-payroll-analysis-report__table td {
  border: 1px solid #cfd8dc;
  padding: 6px 8px;
}

.company-payroll-analysis-report__table thead th {
  background: #eceff1;
  text-align: center;
}

.company-payroll-analysis-report__total-head {
  background: #fff8e1;
}

.company-payroll-analysis-report__avg-head,
.company-payroll-analysis-report__avg-cell {
  background: #fff3c4;
}

.company-payroll-analysis-report__totals-row {
  background: #eceff1;
}
</style>
