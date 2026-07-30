<template>
  <div class="salary-review-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Salary Review</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Review employee pay by department for a date range, grouped by wage and allowance accounts.
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
          <div class="col-12 col-md-4">
            <DateField
              v-model="startDate"
              label="Start date"
              required
              :disable="reportsStore.isLoadingSalaryReview"
            />
          </div>
          <div class="col-12 col-md-4">
            <DateField
              v-model="endDate"
              label="End date"
              required
              :disable="reportsStore.isLoadingSalaryReview"
            />
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="reportsStore.isLoadingSalaryReview"
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
            <div class="text-subtitle1 text-weight-bold">Salary Review</div>
            <div class="text-body2 text-grey-7">{{ formatDateRange(report) }}</div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              :disable="!report.departments.length"
              @click="handleExportExcel"
            />
          </div>
        </div>

        <q-banner
          v-if="!report.departments.length"
          rounded
          class="bg-grey-2 text-grey-8"
        >
          No posted payroll data was found for the selected date range.
        </q-banner>

        <q-tabs
          v-else
          v-model="selectedDepartmentKey"
          dense
          class="text-primary q-mb-md"
          active-color="primary"
          indicator-color="primary"
          align="left"
          narrow-indicator
        >
          <q-tab
            v-for="department in report.departments"
            :key="departmentTabKey(department)"
            :name="departmentTabKey(department)"
            :label="department.departmentName"
          />
        </q-tabs>

        <q-tab-panels v-if="report.departments.length" v-model="selectedDepartmentKey" animated>
          <q-tab-panel
            v-for="department in report.departments"
            :key="departmentTabKey(department)"
            :name="departmentTabKey(department)"
            class="q-pa-none"
          >
            <q-table
              :rows="department.rows"
              :columns="buildColumns(department)"
              :row-key="(row) => row.employeeId"
              flat
              bordered
              dense
              :loading="reportsStore.isLoadingSalaryReview"
              no-data-label="No employees found for this department."
              :pagination="{ rowsPerPage: 20 }"
            >
              <template #body-cell="props">
                <q-td
                  :props="props"
                  :class="props.col.name === 'employeeName' ? '' : 'text-right'"
                >
                  <template v-if="props.col.name === 'employeeName'">
                    {{ props.row.employeeName }}
                  </template>
                  <template v-else>
                    {{ formatSalaryReviewCurrency(Number(props.value ?? 0)) }}
                  </template>
                </q-td>
              </template>

              <template #bottom-row>
                <q-tr class="salary-review-report__totals-row">
                  <q-td class="text-weight-bold">Totals</q-td>
                  <q-td
                    v-for="column in department.columns"
                    :key="`total-${column}`"
                    class="text-right text-weight-bold"
                  >
                    {{ formatSalaryReviewCurrency(department.totals[column] ?? 0) }}
                  </q-td>
                </q-tr>
              </template>
            </q-table>
          </q-tab-panel>
        </q-tab-panels>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import { formatDate } from '../attendance/utils';
import DateField from '@core/components/common/DateField.vue';
import {
  useReportsStore,
  type SalaryReviewDepartment,
  type SalaryReviewReport,
} from '@payroll/stores/reports-store';
import {
  exportSalaryReviewExcel,
  formatSalaryReviewCurrency,
} from '@payroll/utils/salary-review-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { salaryReviewReport: report } = storeToRefs(reportsStore);

const startDate = ref<string | null>(defaultStartDate());
const endDate = ref<string | null>(defaultEndDate());
const selectedDepartmentKey = ref<string | null>(null);

const canGenerate = computed(() =>
  Boolean(startDate.value && endDate.value && startDate.value <= endDate.value),
);

function defaultStartDate(): string {
  const date = new Date();
  return `${date.getFullYear()}-01-01`;
}

function defaultEndDate(): string {
  const date = new Date();
  return date.toISOString().slice(0, 10);
}

function formatDateRange(reportData: SalaryReviewReport): string {
  return `${formatDate(reportData.startDate)} - ${formatDate(reportData.endDate)}`;
}

function departmentTabKey(department: SalaryReviewDepartment): string {
  return department.departmentId !== null
    ? `department-${department.departmentId}`
    : 'department-unassigned';
}

function columnKey(column: string): string {
  return column
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildColumns(department: SalaryReviewDepartment): QTableProps['columns'] {
  return [
    {
      name: 'employeeName',
      label: 'Employee',
      field: 'employeeName',
      align: 'left',
      sortable: true,
    },
    ...department.columns.map((column) => ({
      name: columnKey(column),
      label: column,
      field: (row: SalaryReviewDepartment['rows'][number]) => row.values[column] ?? 0,
      align: 'right' as const,
      sortable: true,
    })),
  ];
}

async function generateReport() {
  if (!canGenerate.value) {
    return;
  }

  const loaded = await reportsStore.fetchSalaryReviewReport(
    startDate.value ?? '',
    endDate.value ?? '',
  );
  if (!loaded) {
    return;
  }

  const firstDepartment = reportsStore.salaryReviewReport?.departments[0];
  selectedDepartmentKey.value = firstDepartment ? departmentTabKey(firstDepartment) : null;
}

function handleExportExcel() {
  if (!report.value) {
    return;
  }

  exportSalaryReviewExcel(report.value);
  $q.notify({ type: 'positive', message: 'Salary review exported to Excel.' });
}
</script>

<style scoped>
.salary-review-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
