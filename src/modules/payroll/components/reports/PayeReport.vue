<template>
  <div class="paye-report">
    <div class="text-h5 text-weight-bold q-mb-xs">PAYE</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Income tax withheld on posted payroll. Choose a date range for the whole company, one department, or one employee.
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
              :disable="reportsStore.isLoadingPaye"
            />
          </div>
          <div class="col-12 col-md-3">
            <DateField
              v-model="endDate"
              label="End date"
              required
              :disable="reportsStore.isLoadingPaye"
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
              :disable="reportsStore.isLoadingPaye"
            />
          </div>
          <div v-if="scope === 'employee'" class="col-12 col-md-4">
            <EmployeeSelect
              v-model="employeeId"
              label="Employee"
              clearable
              :disable="reportsStore.isLoadingPaye"
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
              :loading="reportsStore.isLoadingPaye"
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
            <div class="text-weight-bold">{{ report.company.name }}</div>
            <div v-for="line in report.company.lines" :key="line" class="text-caption">{{ line }}</div>
          </div>
          <div class="col-auto text-right">
            <div class="text-h6 text-weight-bold">{{ report.title }}</div>
            <div class="text-body2">{{ report.periodLabel }}</div>
            <div class="text-caption text-grey-8">{{ report.scopeLabel }} · {{ report.employeeCount }} employees</div>
          </div>
        </div>
        <div class="q-mb-md text-right">
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

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No posted payroll was found for the selected dates.
        </q-banner>

        <div v-else class="paye-report__table-wrap">
          <table class="paye-report__table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>TIN</th>
                <th>Social Security</th>
                <th class="text-right">Weeks</th>
                <th class="text-right">Taxable Gross</th>
                <th class="text-right">Emoluments</th>
                <th class="text-right">Commissions</th>
                <th class="text-right">PAYE Withheld</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(row, index) in report.rows" :key="row.employeeId">
                <tr v-if="showDepartment(index)" class="paye-report__dept-row">
                  <td colspan="9">{{ row.departmentName }}</td>
                </tr>
                <tr>
                  <td>{{ row.displayName }}</td>
                  <td>{{ row.departmentName }}</td>
                  <td>{{ row.tin }}</td>
                  <td>{{ row.socialSecurityNumber }}</td>
                  <td class="text-right">{{ row.weeksEmployed }}</td>
                  <td class="text-right">{{ formatMoney(row.taxableGross) }}</td>
                  <td class="text-right">{{ formatMoney(row.totalEmoluments) }}</td>
                  <td class="text-right">{{ formatMoney(row.commissions) }}</td>
                  <td class="text-right">{{ formatMoney(row.taxWithheld) }}</td>
                </tr>
              </template>
              <tr class="paye-report__total-row">
                <td>TOTAL</td>
                <td></td>
                <td></td>
                <td></td>
                <td class="text-right">{{ report.totals.weeksEmployed }}</td>
                <td class="text-right">{{ formatMoney(report.totals.taxableGross) }}</td>
                <td class="text-right">{{ formatMoney(report.totals.totalEmoluments) }}</td>
                <td class="text-right">{{ formatMoney(report.totals.commissions) }}</td>
                <td class="text-right">{{ formatMoney(report.totals.taxWithheld) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';
import ParentDepartmentSelect from '@hr/components/settings/department/ParentDepartmentSelect.vue';
import { useReportsStore, type PayeScope } from '@payroll/stores/reports-store';
import { exportPayeExcel, exportPayePdf } from '@payroll/utils/paye-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const { payeReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<PayeScope>('company');
const departmentId = ref<number | null>(null);
const employeeId = ref<string | null>(null);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Department', value: 'department' },
  { label: 'Employee', value: 'employee' },
];

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

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0);
}

function showDepartment(index: number): boolean {
  if (scope.value !== 'company') {
    return false;
  }
  const rows = report.value?.rows ?? [];
  if (index === 0) {
    return true;
  }
  return rows[index]?.departmentName !== rows[index - 1]?.departmentName;
}

watch(scope, () => {
  reportsStore.clearPayeReport();
});

async function generateReport() {
  if (!canGenerate.value || !startDate.value || !endDate.value) return;
  const ok = await reportsStore.fetchPayeReport({
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentId: departmentId.value,
    employeeId: employeeId.value,
  });
  if (!ok) {
    $q.notify({ type: 'negative', message: reportsStore.error || 'Failed to generate PAYE report.' });
  }
}

function handleExportExcel() {
  if (!report.value) return;
  exportPayeExcel(report.value);
  $q.notify({ type: 'positive', message: 'PAYE exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportPayePdf(report.value);
  if (!opened) {
    $q.notify({ type: 'negative', message: 'Allow pop-ups to export the PDF.' });
  }
}
</script>

<style scoped>
.paye-report__table-wrap {
  overflow-x: auto;
}

.paye-report__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.paye-report__table th,
.paye-report__table td {
  border: 1px solid #d0d0d0;
  padding: 4px 6px;
  white-space: nowrap;
}

.paye-report__table thead th {
  background: #f3f3f3;
}

.paye-report__dept-row td {
  background: #e8eef6;
  font-weight: 700;
}

.paye-report__total-row td {
  background: #ececec;
  font-weight: 700;
}
</style>
