<template>
  <div class="emoluments-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Emoluments and Withheld Tax</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Select a year that already has payroll, the whole company or one department, and how to sort.
      Each month with payroll is a group of weeks, total emoluments, taxable benefit, commission, and tax withheld.
      Commission is the amount posted to a commission earning code.
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
          <div class="col-12 col-md-3">
            <q-select
              v-model="year"
              :options="yearOptions"
              outlined
              dense
              label="Year"
              :loading="reportsStore.isLoadingEmolumentsWithheldTaxYears"
              :disable="reportsStore.isLoadingEmolumentsWithheldTax || !yearOptions.length"
              :hint="yearOptions.length ? '' : 'No payroll has been generated yet.'"
              @update:model-value="onYearChanged"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-option-group
              v-model="scope"
              :options="scopeOptions"
              color="primary"
              dense
              inline
              class="q-pt-sm"
            />
          </div>
          <div v-if="scope === 'department'" class="col-12 col-md-4">
            <ParentDepartmentSelect
              v-model="departmentId"
              label="Department"
              outlined
              dense
              clearable
              :disable="reportsStore.isLoadingEmolumentsWithheldTax"
            />
          </div>
          <div class="col-12 col-md-4">
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
              :disable="reportsStore.isLoadingEmolumentsWithheldTax"
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
              :loading="reportsStore.isLoadingEmolumentsWithheldTax"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-start q-col-gutter-md q-mb-md">
          <div class="col">
            <div class="text-h6 text-weight-bold">{{ report.year }} Emoluments and Withheld Tax</div>
            <div class="text-caption text-grey-8">{{ report.scopeLabel }} · {{ report.employeeCount }} employees</div>
          </div>
          <div class="col-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              :disable="!report.rows.length"
              @click="handleExportExcel"
            />
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No posted payroll was found for this year.
        </q-banner>

        <div v-else class="emoluments-report__wrap">
          <table class="emoluments-report__table">
            <thead>
              <tr>
                <th rowspan="2">TIN</th>
                <th rowspan="2">Name</th>
                <template v-for="month in report.months" :key="month.value">
                  <th colspan="5" class="month">{{ month.label }}</th>
                  <th rowspan="2" class="spacer" />
                </template>
                <th colspan="5" class="month">TOTAL</th>
              </tr>
              <tr>
                <template v-for="month in report.months" :key="`fields-${month.value}`">
                  <th v-for="field in report.fields" :key="`${month.value}-${field.key}`" class="num">
                    {{ field.label }}
                  </th>
                </template>
                <th v-for="field in report.fields" :key="`total-${field.key}`" class="num">
                  {{ field.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in report.rows" :key="row.employeeId">
                <td>{{ row.tin }}</td>
                <td>{{ row.name }}</td>
                <template v-for="month in report.months" :key="`${row.employeeId}-${month.value}`">
                  <td
                    v-for="field in report.fields"
                    :key="`${row.employeeId}-${month.value}-${field.key}`"
                    class="num"
                  >
                    {{ displayField(monthValue(row, month.value), field.key) }}
                  </td>
                  <td class="spacer" />
                </template>
                <td v-for="field in report.fields" :key="`${row.employeeId}-total-${field.key}`" class="num">
                  {{ displayField(row.total, field.key) }}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="text-weight-bold">Total</td>
                <td />
                <template v-for="month in report.months" :key="`sum-${month.value}`">
                  <td
                    v-for="field in report.fields"
                    :key="`sum-${month.value}-${field.key}`"
                    class="num"
                  >
                    {{ displayField(monthValue(report.totals, month.value), field.key) }}
                  </td>
                  <td class="spacer" />
                </template>
                <td v-for="field in report.fields" :key="`sum-total-${field.key}`" class="num">
                  {{ displayField(report.totals.total, field.key) }}
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
import { computed, onMounted, onUnmounted, ref } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import { sharedReportMonth, writeReportPeriod } from '@payroll/composables/use-report-period';
import {
  useReportsStore,
  type EmolumentsMonthValues,
  type EmolumentsWithheldTaxScope,
  type EmolumentsWithheldTaxSortKey,
} from '@payroll/stores/reports-store';
import { exportEmolumentsWithheldTaxExcel } from '@payroll/utils/emoluments-withheld-tax-export';

const SORT_STORAGE_KEY = 'payroll.emoluments-withheld-tax.sort';
const SORT_KEYS: EmolumentsWithheldTaxSortKey[] = ['lastName', 'firstName', 'tin', 'department'];

const $q = useQuasar();
const reportsStore = useReportsStore();
const { emolumentsWithheldTaxReport: report } = storeToRefs(reportsStore);

const shared = sharedReportMonth();
const year = ref<number | null>(shared?.year ?? null);
const scope = ref<EmolumentsWithheldTaxScope>('company');
const departmentId = ref<number | null>(null);
const sortBy = ref<EmolumentsWithheldTaxSortKey[]>(readSort());

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
];

const sortOptions = [
  { label: 'Last name', value: 'lastName' },
  { label: 'First name', value: 'firstName' },
  { label: 'TIN', value: 'tin' },
  { label: 'Department', value: 'department' },
];

const yearOptions = computed(() => reportsStore.emolumentsWithheldTaxYears);

const canGenerate = computed(() => {
  if (year.value == null || !yearOptions.value.length) {
    return false;
  }
  return scope.value === 'company' || departmentId.value != null;
});

onMounted(() => {
  void reportsStore.fetchEmolumentsWithheldTaxYears().then(() => {
    const years = reportsStore.emolumentsWithheldTaxYears;
    if (!years.length) {
      year.value = null;
      return;
    }
    if (year.value == null || !years.includes(year.value)) {
      year.value = years[0] ?? null;
    }
  });
});

onUnmounted(() => {
  reportsStore.clearEmolumentsWithheldTaxReport();
});

function readSort(): EmolumentsWithheldTaxSortKey[] {
  const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
  if (!stored) {
    return ['lastName', 'firstName'];
  }
  try {
    const parsed = JSON.parse(stored) as unknown;
    if (!Array.isArray(parsed)) {
      return ['lastName', 'firstName'];
    }
    const keys = parsed.filter((key): key is EmolumentsWithheldTaxSortKey =>
      SORT_KEYS.includes(key as EmolumentsWithheldTaxSortKey),
    );
    return keys.length ? keys : ['lastName', 'firstName'];
  } catch {
    return ['lastName', 'firstName'];
  }
}

function onYearChanged(value: number | null) {
  if (value == null) {
    return;
  }
  writeReportPeriod(`${value}-01-01`, `${value}-12-31`);
}

function monthValue(
  source: { months: Record<string, EmolumentsMonthValues | null> },
  month: number,
): EmolumentsMonthValues | null {
  return source.months[String(month)] ?? null;
}

function displayField(values: EmolumentsMonthValues | null, key: keyof EmolumentsMonthValues): string {
  if (!values || values[key] == null) {
    return '';
  }
  if (key === 'weeks') {
    return String(values.weeks);
  }
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(
    Number(values[key]),
  );
}

function generateReport() {
  const selectedYear = year.value;
  if (selectedYear == null) {
    return;
  }
  window.localStorage.setItem(SORT_STORAGE_KEY, JSON.stringify(sortBy.value));
  const selectedDepartment = departmentId.value;
  void reportsStore.fetchEmolumentsWithheldTaxReport({
    year: selectedYear,
    scope: scope.value,
    departmentId: scope.value === 'department' ? selectedDepartment : null,
    sortBy: sortBy.value,
  }).then((ok) => {
    if (!ok && reportsStore.error) {
      $q.notify({ type: 'negative', message: reportsStore.error });
    }
  });
}

function handleExportExcel() {
  if (report.value) {
    exportEmolumentsWithheldTaxExcel(report.value);
  }
}
</script>

<style scoped>
.emoluments-report__wrap {
  overflow: auto;
  max-height: 70vh;
}

.emoluments-report__table {
  border-collapse: collapse;
  font-size: 12px;
  white-space: nowrap;
}

.emoluments-report__table th,
.emoluments-report__table td {
  border: 1px solid #d0d0d0;
  padding: 4px 8px;
  background: #fff;
}

.emoluments-report__table th {
  font-weight: 700;
  text-align: center;
}

.emoluments-report__table .num {
  text-align: right;
}

.emoluments-report__table .month {
  background: #f4f4f4;
}

.emoluments-report__table .spacer {
  width: 10px;
  min-width: 10px;
  padding: 0;
  background: #d9d9d9;
  border-top-color: #d9d9d9;
  border-bottom-color: #d9d9d9;
}

.emoluments-report__table tfoot td {
  font-weight: 700;
}
</style>
