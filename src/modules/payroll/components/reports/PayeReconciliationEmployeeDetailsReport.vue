<template>
  <div class="paye-reconciliation-employee-details-report">
    <div class="text-h5 text-weight-bold q-mb-xs">PAYE Reconciliation Employee Details</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Belize Tax Services PAYE reconciliation for a year with payroll, for the full year or one month.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report period</div>

        <div class="row q-col-gutter-md items-end">
          <div class="col-12 col-md-3">
            <q-select
              v-model="year"
              :options="yearOptions"
              label="Year"
              outlined
              dense
              :loading="reportsStore.isLoadingPayeReconciliationEmployeeDetailsPeriods"
              :disable="isBusy || !yearOptions.length"
              @update:model-value="onYearChanged"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="period"
              :options="periodOptions"
              emit-value
              map-options
              label="Period"
              outlined
              dense
              :loading="reportsStore.isLoadingPayeReconciliationEmployeeDetailsPeriods"
              :disable="isBusy || !periodOptions.length"
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
              :loading="reportsStore.isLoadingPayeReconciliationEmployeeDetails"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>

        <q-banner
          v-if="!reportsStore.isLoadingPayeReconciliationEmployeeDetailsPeriods && !yearOptions.length"
          rounded
          class="bg-grey-2 text-grey-8 q-mt-md"
        >
          No payroll has been generated yet. Year and period options appear after payroll is generated.
        </q-banner>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="text-subtitle1 text-weight-bold">PAYE Reconciliation Employee Details</div>
            <div class="text-body2 text-grey-7">
              {{ report.period }} {{ report.year }}
              <span v-if="report.submitter.name"> · {{ report.submitter.name }}</span>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              :loading="isExporting"
              :disable="!report.rows.length || isExporting"
              @click="handleExportExcel"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7">Submitter TIN</div>
            <div class="text-body1">{{ report.submitter.tin || '—' }}</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7">Employees</div>
            <div class="text-body1">{{ report.rows.length }}</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7">Total Emoluments</div>
            <div class="text-body1">{{ formatPayeReconciliationCurrency(report.totals.totalEmoluments) }}</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7">Tax Withheld</div>
            <div class="text-body1">{{ formatPayeReconciliationCurrency(report.totals.taxWithheld) }}</div>
          </div>
        </div>

        <q-banner
          v-if="!report.rows.length"
          rounded
          class="bg-grey-2 text-grey-8"
        >
          No posted payroll data was found for the selected period.
        </q-banner>

        <q-table
          v-else
          :rows="report.rows"
          :columns="columns"
          row-key="employeeId"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingPayeReconciliationEmployeeDetails"
          :pagination="{ rowsPerPage: 25 }"
        >
          <template #body-cell-totalEmoluments="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeReconciliationCurrency(props.row.totalEmoluments) }}
            </q-td>
          </template>
          <template #body-cell-taxableBenefits="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeReconciliationCurrency(props.row.taxableBenefits) }}
            </q-td>
          </template>
          <template #body-cell-commissions="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeReconciliationCurrency(props.row.commissions) }}
            </q-td>
          </template>
          <template #body-cell-taxWithheld="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeReconciliationCurrency(props.row.taxWithheld) }}
            </q-td>
          </template>

          <template #bottom-row>
            <q-tr class="paye-reconciliation-employee-details-report__totals-row">
              <q-td class="text-weight-bold">Totals</q-td>
              <q-td />
              <q-td />
              <q-td />
              <q-td />
              <q-td class="text-right text-weight-bold">
                {{ formatPayeReconciliationCurrency(report.totals.totalEmoluments) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeReconciliationCurrency(report.totals.taxableBenefits) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeReconciliationCurrency(report.totals.commissions) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeReconciliationCurrency(report.totals.taxWithheld) }}
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { useReportsStore } from '@payroll/stores/reports-store';
import {
  exportPayeReconciliationEmployeeDetailsExcel,
  formatPayeReconciliationCurrency,
} from '@payroll/utils/paye-reconciliation-employee-details-export';

type PeriodValue = 'annual' | number;

const $q = useQuasar();
const reportsStore = useReportsStore();
const {
  payeReconciliationEmployeeDetailsReport: report,
  payeReconciliationEmployeeDetailsPeriods: periods,
} = storeToRefs(reportsStore);

const year = ref<number | null>(null);
const period = ref<PeriodValue | null>('annual');
const isExporting = ref(false);

const yearOptions = computed(() => periods.value?.years ?? []);
const periodOptions = computed(() => {
  if (!year.value || !periods.value) return [];
  const months = periods.value.monthsByYear[String(year.value)] ?? [];
  return [
    { label: 'Annual', value: 'annual' as PeriodValue },
    ...months.map((month) => ({ label: month.label, value: month.value as PeriodValue })),
  ];
});

const isBusy = computed(
  () =>
    reportsStore.isLoadingPayeReconciliationEmployeeDetails
    || reportsStore.isLoadingPayeReconciliationEmployeeDetailsPeriods,
);

const canGenerate = computed(() => {
  if (!year.value || !period.value || isBusy.value || !yearOptions.value.length) return false;
  return periodOptions.value.some((option) => option.value === period.value);
});

const columns: QTableProps['columns'] = [
  { name: 'tin', label: 'TIN', field: 'tin', align: 'left', sortable: true },
  { name: 'taxpayerName', label: 'Taxpayer Name', field: 'taxpayerName', align: 'left', sortable: true },
  {
    name: 'socialSecurityNumber',
    label: 'Social Security Number',
    field: 'socialSecurityNumber',
    align: 'left',
    sortable: true,
  },
  { name: 'passport', label: 'Passport', field: 'passport', align: 'left' },
  {
    name: 'numberOfWeeksEmployed',
    label: 'Weeks Employed',
    field: 'numberOfWeeksEmployed',
    align: 'right',
    sortable: true,
  },
  {
    name: 'totalEmoluments',
    label: 'Total Emoluments',
    field: 'totalEmoluments',
    align: 'right',
    sortable: true,
  },
  {
    name: 'taxableBenefits',
    label: 'Taxable Benefits',
    field: 'taxableBenefits',
    align: 'right',
    sortable: true,
  },
  {
    name: 'commissions',
    label: 'Commissions',
    field: 'commissions',
    align: 'right',
    sortable: true,
  },
  {
    name: 'taxWithheld',
    label: 'Tax Withheld',
    field: 'taxWithheld',
    align: 'right',
    sortable: true,
  },
];

function selectDefaultPeriod() {
  const availableYears = periods.value?.years ?? [];
  if (!availableYears.length) {
    year.value = null;
    period.value = null;
    return;
  }

  if (!year.value || !availableYears.includes(year.value)) {
    year.value = availableYears[0] ?? null;
  }

  syncPeriodToAvailableOptions();
}

function syncPeriodToAvailableOptions() {
  const options = periodOptions.value;
  if (!options.length) {
    period.value = null;
    return;
  }

  if (!period.value || !options.some((option) => option.value === period.value)) {
    period.value = 'annual';
  }
}

function onYearChanged() {
  syncPeriodToAvailableOptions();
}

watch(periodOptions, () => {
  syncPeriodToAvailableOptions();
});

async function generateReport() {
  if (!year.value || !period.value) return;

  const ok = await reportsStore.fetchPayeReconciliationEmployeeDetailsReport({
    year: year.value,
    period: period.value,
  });

  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to generate PAYE reconciliation employee details.',
      position: 'top',
    });
  }
}

async function handleExportExcel() {
  if (!report.value) return;

  isExporting.value = true;
  try {
    await exportPayeReconciliationEmployeeDetailsExcel(report.value);
    $q.notify({
      type: 'positive',
      message: 'PAYE reconciliation workbook downloaded.',
      position: 'top',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to export Excel workbook.',
      position: 'top',
    });
  } finally {
    isExporting.value = false;
  }
}

onMounted(async () => {
  const ok = await reportsStore.fetchPayeReconciliationEmployeeDetailsPeriods();
  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to load available payroll periods.',
      position: 'top',
    });
    return;
  }

  selectDefaultPeriod();
});
</script>

<style scoped>
.paye-reconciliation-employee-details-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
