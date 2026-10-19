<template>
  <div class="paye-employment-details-report">
    <div class="text-h5 text-weight-bold q-mb-xs">PAYE employee details</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Belize Tax Services PAYE employee details for a year and month that already have payroll.
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
              :loading="reportsStore.isLoadingPayeEmploymentDetailsPeriods"
              :disable="isBusy || !yearOptions.length"
              @update:model-value="onYearChanged"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-select
              v-model="month"
              :options="monthOptions"
              emit-value
              map-options
              label="Month"
              outlined
              dense
              :loading="reportsStore.isLoadingPayeEmploymentDetailsPeriods"
              :disable="isBusy || !monthOptions.length"
              @update:model-value="onMonthChanged"
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
              :loading="reportsStore.isLoadingPayeEmploymentDetails"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>

        <q-banner
          v-if="!reportsStore.isLoadingPayeEmploymentDetailsPeriods && !yearOptions.length"
          rounded
          class="bg-grey-2 text-grey-8 q-mt-md"
        >
          No payroll has been generated yet. Year and month options appear after payroll is generated.
        </q-banner>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="text-subtitle1 text-weight-bold">PAYE employee details</div>
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
            <div class="text-body1">{{ formatPayeCurrency(report.totals.totalEmoluments) }}</div>
          </div>
          <div class="col-12 col-sm-6 col-md-3">
            <div class="text-caption text-grey-7">Tax Withheld</div>
            <div class="text-body1">{{ formatPayeCurrency(report.totals.taxWithheld) }}</div>
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
          :loading="reportsStore.isLoadingPayeEmploymentDetails"
          :pagination="{ rowsPerPage: 25 }"
        >
          <template #body-cell-totalEmoluments="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeCurrency(props.row.totalEmoluments) }}
            </q-td>
          </template>
          <template #body-cell-taxableBenefits="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeCurrency(props.row.taxableBenefits) }}
            </q-td>
          </template>
          <template #body-cell-commissions="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeCurrency(props.row.commissions) }}
            </q-td>
          </template>
          <template #body-cell-taxWithheld="props">
            <q-td :props="props" class="text-right">
              {{ formatPayeCurrency(props.row.taxWithheld) }}
            </q-td>
          </template>

          <template #bottom-row>
            <q-tr class="paye-employment-details-report__totals-row">
              <q-td class="text-weight-bold">Totals</q-td>
              <q-td />
              <q-td />
              <q-td />
              <q-td />
              <q-td class="text-right text-weight-bold">
                {{ formatPayeCurrency(report.totals.totalEmoluments) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeCurrency(report.totals.taxableBenefits) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeCurrency(report.totals.commissions) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatPayeCurrency(report.totals.taxWithheld) }}
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
import { rememberReportMonth, sharedReportMonth } from '@payroll/composables/use-report-period';
import {
  exportPayeEmploymentDetailsExcel,
  formatPayeCurrency,
} from '@payroll/utils/paye-employment-details-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const {
  payeEmploymentDetailsReport: report,
  payeEmploymentDetailsPeriods: periods,
} = storeToRefs(reportsStore);

const year = ref<number | null>(null);
const month = ref<number | null>(null);
const isExporting = ref(false);

const yearOptions = computed(() => periods.value?.years ?? []);
const monthOptions = computed(() => {
  if (!year.value || !periods.value) return [];
  return periods.value.monthsByYear[String(year.value)] ?? [];
});

const isBusy = computed(
  () =>
    reportsStore.isLoadingPayeEmploymentDetails
    || reportsStore.isLoadingPayeEmploymentDetailsPeriods,
);

const canGenerate = computed(() => {
  if (!year.value || !month.value || isBusy.value || !yearOptions.value.length) return false;
  return monthOptions.value.some((option) => option.value === month.value);
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
    month.value = null;
    return;
  }

  const shared = sharedReportMonth();
  if ((!year.value || !availableYears.includes(year.value)) && shared && availableYears.includes(shared.year)) {
    year.value = shared.year;
    month.value = shared.month;
  }

  if (!year.value || !availableYears.includes(year.value)) {
    year.value = availableYears[0] ?? null;
  }

  syncMonthToAvailableOptions();
}

function syncMonthToAvailableOptions() {
  const options = monthOptions.value;
  if (!options.length) {
    month.value = null;
    return;
  }

  if (!month.value || !options.some((option) => option.value === month.value)) {
    month.value = options[0]?.value ?? null;
  }
}

function onYearChanged() {
  syncMonthToAvailableOptions();
  publishPeriod();
}

function onMonthChanged() {
  publishPeriod();
}

function publishPeriod() {
  if (year.value && month.value) {
    rememberReportMonth(year.value, month.value);
  }
}

watch(monthOptions, () => {
  syncMonthToAvailableOptions();
});

async function generateReport() {
  if (!year.value || !month.value) return;

  const ok = await reportsStore.fetchPayeEmploymentDetailsReport({
    year: year.value,
    month: month.value,
  });

  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to generate PAYE employee details.',
      position: 'top',
    });
  }
}

async function handleExportExcel() {
  if (!report.value) return;

  isExporting.value = true;
  try {
    await exportPayeEmploymentDetailsExcel(report.value);
    $q.notify({
      type: 'positive',
      message: 'PAYE employee details workbook downloaded.',
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
  const ok = await reportsStore.fetchPayeEmploymentDetailsPeriods();
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
.paye-employment-details-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
