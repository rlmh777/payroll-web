<template>
  <div class="ss-payments-by-month-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Social Security Payments by Month</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      One row per employee per Monday in the selected month. Results are stored and can be recalculated.
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
              :loading="reportsStore.isLoadingSocialSecurityPaymentsByMonthPeriods"
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
              :loading="reportsStore.isLoadingSocialSecurityPaymentsByMonthPeriods"
              :disable="isBusy || !monthOptions.length"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              outline
              icon="search"
              label="Load saved"
              class="full-width"
              :loading="reportsStore.isLoadingSocialSecurityPaymentsByMonth"
              :disable="!canRun"
              @click="loadSaved"
            />
          </div>
          <div class="col-12 col-md-3">
            <q-btn
              color="primary"
              icon="refresh"
              label="Recalculate"
              class="full-width"
              :loading="reportsStore.isRecalculatingSocialSecurityPaymentsByMonth"
              :disable="!canRun"
              @click="recalculate"
            />
          </div>
        </div>

        <q-banner
          v-if="!reportsStore.isLoadingSocialSecurityPaymentsByMonthPeriods && !yearOptions.length"
          rounded
          class="bg-grey-2 text-grey-8 q-mt-md"
        >
          No posted payroll runs were found. Year and month options appear after payroll is executed.
        </q-banner>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="text-subtitle1 text-weight-bold">
              {{ report.monthName }} {{ report.year }}
            </div>
            <div class="text-body2 text-grey-7">
              <template v-if="report.calculatedAt">
                Last calculated {{ formatTimestamp(report.calculatedAt) }}
              </template>
              <template v-else>
                No saved calculation for this period yet.
              </template>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="download"
              label="Export pipe file"
              :disable="!report.rows.length"
              @click="exportPipeFile"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Rows</div>
            <div class="text-body1">{{ report.totals.rowCount }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Weekly Gross Total</div>
            <div class="text-body1">{{ formatMoney(report.totals.weeklyGrossPay) }}</div>
          </div>
          <div class="col-12 col-sm-4">
            <div class="text-caption text-grey-7">Social Security Total</div>
            <div class="text-body1">{{ formatMoney(report.totals.socialSecurityAmount) }}</div>
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No rows for this period. Recalculate after posted payroll exists for the selected month.
        </q-banner>

        <q-table
          v-else
          :rows="report.rows"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="isBusy"
          :pagination="{ rowsPerPage: 50 }"
        >
          <template #body-cell-blank="props">
            <q-td :props="props">&nbsp;</q-td>
          </template>
          <template #body-cell-weeklyGrossPay="props">
            <q-td :props="props" class="text-right">
              {{ formatMoney(props.row.weeklyGrossPay) }}
            </q-td>
          </template>
          <template #body-cell-socialSecurityAmount="props">
            <q-td :props="props" class="text-right">
              {{ formatMoney(props.row.socialSecurityAmount) }}
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import type { QTableProps } from 'quasar';
import { storeToRefs } from 'pinia';
import { useReportsStore } from '@payroll/stores/reports-store';

const $q = useQuasar();
const reportsStore = useReportsStore();
const {
  socialSecurityPaymentsByMonthReport: report,
  socialSecurityPaymentsByMonthPeriods: periods,
} = storeToRefs(reportsStore);

const year = ref<number | null>(null);
const month = ref<number | null>(null);

const yearOptions = computed(() => periods.value?.years ?? []);
const monthOptions = computed(() => {
  if (!year.value || !periods.value) return [];
  return periods.value.monthsByYear[String(year.value)] ?? [];
});

const canRun = computed(() => Boolean(year.value && month.value));
const isBusy = computed(
  () =>
    reportsStore.isLoadingSocialSecurityPaymentsByMonth
    || reportsStore.isRecalculatingSocialSecurityPaymentsByMonth
    || reportsStore.isLoadingSocialSecurityPaymentsByMonthPeriods,
);

const columns: QTableProps['columns'] = [
  {
    name: 'employeeSocialSecurityNumber',
    label: 'Employee SS#',
    field: 'employeeSocialSecurityNumber',
    align: 'left',
    sortable: true,
  },
  {
    name: 'companySocialSecurityNumber',
    label: 'Company SS#',
    field: 'companySocialSecurityNumber',
    align: 'left',
  },
  { name: 'year', label: 'Year', field: 'year', align: 'right' },
  { name: 'monthName', label: 'Month', field: 'monthName', align: 'left' },
  {
    name: 'calendarWeek',
    label: 'Week',
    field: 'calendarWeek',
    align: 'right',
    sortable: true,
  },
  {
    name: 'weeklyGrossPay',
    label: 'Weekly Gross',
    field: 'weeklyGrossPay',
    align: 'right',
    sortable: true,
  },
  {
    name: 'socialSecurityAmount',
    label: 'SS Amount',
    field: 'socialSecurityAmount',
    align: 'right',
    sortable: true,
  },
  {
    name: 'electronicEmployerNumber',
    label: 'Electronic Employer #',
    field: 'electronicEmployerNumber',
    align: 'left',
  },
  { name: 'dateHired', label: 'Date Hired', field: 'dateHired', align: 'left' },
  { name: 'blank', label: '', field: 'blank', align: 'left' },
  { name: 'firstName', label: 'First Name', field: 'firstName', align: 'left', sortable: true },
  { name: 'lastName', label: 'Last Name', field: 'lastName', align: 'left', sortable: true },
  { name: 'recordCode', label: '', field: 'recordCode', align: 'left' },
];

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function selectDefaultPeriod() {
  const availableYears = periods.value?.years ?? [];
  if (!availableYears.length) {
    year.value = null;
    month.value = null;
    return;
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
}

watch(monthOptions, () => {
  syncMonthToAvailableOptions();
});

async function loadSaved() {
  if (!year.value || !month.value) return;

  const ok = await reportsStore.fetchSocialSecurityPaymentsByMonthReport(year.value, month.value);
  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to load saved report.',
      position: 'top',
    });
  }
}

async function recalculate() {
  if (!year.value || !month.value) return;

  const ok = await reportsStore.recalculateSocialSecurityPaymentsByMonthReport(year.value, month.value);
  if (ok) {
    $q.notify({
      type: 'positive',
      message: 'Social security payments report recalculated and saved.',
      position: 'top',
    });
  } else {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to recalculate report.',
      position: 'top',
    });
  }
}

function exportPipeFile() {
  if (!report.value?.rows.length) return;

  const lines = report.value.rows.map((row) =>
    [
      row.employeeSocialSecurityNumber || '',
      row.companySocialSecurityNumber || '',
      row.year,
      row.monthName,
      row.calendarWeek,
      formatMoney(row.weeklyGrossPay),
      formatMoney(row.socialSecurityAmount),
      row.electronicEmployerNumber || '',
      row.dateHired || '',
      '',
      row.firstName || '',
      row.lastName || '',
      row.recordCode || 'P',
      '',
    ].join('|'),
  );

  const blob = new Blob([`${lines.join('\n')}\n`], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `social_security_payments_${report.value.year}_${String(report.value.month).padStart(2, '0')}.txt`;
  anchor.click();
  URL.revokeObjectURL(url);
}

onMounted(async () => {
  const ok = await reportsStore.fetchSocialSecurityPaymentsByMonthPeriods();
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
