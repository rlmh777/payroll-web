<template>
  <div class="ss-deduction">
    <div class="text-h5 text-weight-bold q-mb-xs">Social Security Deduction</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Posted payroll, one page per employee. Each row is a calendar week.
      Employee and employer amounts come from the social security contribution table for that week.
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
            <DateField v-model="startDate" label="Start date" required :disable="reportsStore.isLoadingSocialSecurityDeduction" />
          </div>
          <div class="col-12 col-md-3">
            <DateField v-model="endDate" label="End date" required :disable="reportsStore.isLoadingSocialSecurityDeduction" />
          </div>
          <div class="col-12">
            <q-option-group v-model="scope" :options="scopeOptions" color="primary" dense inline />
          </div>
          <div v-if="scope === 'department'" class="col-12 col-md-6">
            <q-select
              v-model="departmentIds"
              :options="departmentStore.departmentOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              multiple
              use-chips
              outlined
              dense
              clearable
              label="Departments"
              hint="Leave empty to include every department"
              :disable="reportsStore.isLoadingSocialSecurityDeduction"
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
              :disable="reportsStore.isLoadingSocialSecurityDeduction"
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
              :loading="reportsStore.isLoadingSocialSecurityDeduction"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="text-caption text-grey-8 q-mb-md">
          {{ report.scopeLabel }} · {{ report.employeeCount }} employees · {{ report.pageCount }} pages
        </div>
        <div class="q-mb-md text-right">
          <q-btn
            outline
            color="primary"
            icon="table_view"
            label="Export Excel"
            class="q-mr-sm"
            :disable="!report.pageCount"
            @click="handleExportExcel"
          />
          <q-btn
            outline
            color="primary"
            icon="picture_as_pdf"
            label="Export PDF"
            :disable="!report.pageCount"
            @click="handleExportPdf"
          />
        </div>

        <q-banner v-if="!report.pageCount" rounded class="bg-grey-2 text-grey-8">
          No posted payroll was found for the selected dates.
        </q-banner>

        <article
          v-for="(department, departmentIndex) in report.departments"
          :key="department.departmentId"
        >
          <section
            v-for="(employee, employeeIndex) in department.employees"
            :key="`${department.departmentId}-${employee.employeeId}`"
            class="ss-page"
          >
            <div class="ss-page__top">
              <h2>{{ report.title }}</h2>
              <div>Page {{ employee.pageNumber }} of {{ report.pageCount }}</div>
            </div>
            <div class="ss-page__meta">
              <span>Organization</span>
              <strong>{{ report.organization }}</strong>
            </div>
            <div class="ss-page__meta">
              <span>Period</span>
              <strong>{{ report.periodStart }}</strong>
              <strong>{{ report.periodEnd }}</strong>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Last Name</th>
                  <th>First Name</th>
                  <th>SSN</th>
                  <th colspan="2">Payroll Period</th>
                  <th>Week No</th>
                  <th>Employee Contrib.</th>
                  <th>Employer Contrib.</th>
                  <th>Total Contrib.</th>
                </tr>
              </thead>
              <tbody>
                <tr class="department">
                  <td colspan="9">{{ department.name }}</td>
                </tr>
                <tr class="employee">
                  <td>{{ employee.lastName }}</td>
                  <td>{{ employee.firstName }}</td>
                  <td colspan="7" />
                </tr>
                <tr v-for="week in employee.weeks" :key="`${employee.employeeId}-${week.weekYear}-${week.weekNumber}-${week.periodStartIso}`">
                  <td />
                  <td />
                  <td>{{ week.socialSecurityNumber }}</td>
                  <td class="center">{{ week.periodStart }}</td>
                  <td class="center">{{ week.periodEnd }}</td>
                  <td class="center">{{ week.weekNumber }}</td>
                  <td class="num">{{ formatMoney(week.employeeContribution) }}</td>
                  <td class="num">{{ formatMoney(week.employerContribution) }}</td>
                  <td class="num">{{ formatMoney(week.totalContribution) }}</td>
                </tr>
                <tr class="totals">
                  <td>{{ employee.weekCount }}</td>
                  <td colspan="4" />
                  <td class="num">Totals:</td>
                  <td class="num">{{ formatMoney(employee.totals.employeeContribution) }}</td>
                  <td class="num">{{ formatMoney(employee.totals.employerContribution) }}</td>
                  <td class="num">{{ formatMoney(employee.totals.totalContribution) }}</td>
                </tr>
                <tr v-if="employeeIndex === department.employees.length - 1" class="department-total">
                  <td colspan="2">{{ department.name }} Total EEs:</td>
                  <td>{{ department.employeeCount }}</td>
                  <td colspan="2" />
                  <td class="num">Totals</td>
                  <td class="num">{{ formatMoney(department.totals.employeeContribution) }}</td>
                  <td class="num">{{ formatMoney(department.totals.employerContribution) }}</td>
                  <td class="num">{{ formatMoney(department.totals.totalContribution) }}</td>
                </tr>
                <tr v-if="departmentIndex === report.departments.length - 1 && employeeIndex === department.employees.length - 1" class="grand">
                  <td colspan="2">Total Employees</td>
                  <td>{{ report.employeeCount }}</td>
                  <td colspan="2" />
                  <td class="num">Grand Totals:</td>
                  <td class="num">{{ formatMoney(report.totals.employeeContribution) }}</td>
                  <td class="num">{{ formatMoney(report.totals.employerContribution) }}</td>
                  <td class="num">{{ formatMoney(report.totals.totalContribution) }}</td>
                </tr>
              </tbody>
            </table>
          </section>
        </article>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import ReportHeaderSelect from '@payroll/components/reports/ReportHeaderSelect.vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import DateField from '@core/components/common/DateField.vue';
import { useSharedReportDates } from '@payroll/composables/use-report-period';
import { useDepartmentStore } from '@hr/stores/department-store';
import {
  useReportsStore,
  type SocialSecurityDeductionScope,
  type SocialSecurityDeductionSortKey,
} from '@payroll/stores/reports-store';
import {
  exportSocialSecurityDeductionExcel,
  exportSocialSecurityDeductionPdf,
} from '@payroll/utils/social-security-deduction-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const departmentStore = useDepartmentStore();
const { socialSecurityDeductionReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<SocialSecurityDeductionScope>('company');
const departmentIds = ref<number[]>([]);
const sortBy = ref<SocialSecurityDeductionSortKey[]>(['lastName', 'firstName']);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Departments', value: 'department' },
];

const sortOptions = [
  { label: 'Last name', value: 'lastName' },
  { label: 'First name', value: 'firstName' },
  { label: 'Social security number', value: 'socialSecurityNumber' },
  { label: 'Department', value: 'department' },
];

const canGenerate = computed(() => Boolean(startDate.value && endDate.value && startDate.value <= endDate.value));

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

function generateReport() {
  if (!startDate.value || !endDate.value) return;
  void reportsStore.fetchSocialSecurityDeductionReport({
    startDate: startDate.value,
    endDate: endDate.value,
    scope: scope.value,
    departmentIds: departmentIds.value,
    sortBy: sortBy.value,
  }).then((ok) => {
    if (!ok && reportsStore.error) {
      $q.notify({ type: 'negative', message: reportsStore.error });
    }
  });
}

function handleExportExcel() {
  if (report.value) exportSocialSecurityDeductionExcel(report.value);
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportSocialSecurityDeductionPdf(report.value);
  if (!opened) {
    $q.notify({ type: 'warning', message: 'Allow pop-ups to export the PDF.' });
  }
}

onMounted(() => {
  if (!departmentStore.departmentOptions.length) {
    void departmentStore.fetchDepartmentOptions();
  }
});
</script>

<style scoped>
.ss-page {
  margin-bottom: 28px;
  padding-bottom: 12px;
  border-bottom: 1px dashed #c5c5c5;
}

.ss-page__top {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: start;
}

.ss-page__top h2 {
  margin: 0 0 8px;
  color: #1f4e9b;
  font-size: 22px;
  text-align: center;
  grid-column: 1 / -1;
}

.ss-page__top div {
  justify-self: end;
  margin-top: -28px;
}

.ss-page__meta {
  display: flex;
  gap: 16px;
  margin-bottom: 4px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin-top: 8px;
}

th,
td {
  border: 1px solid #8e8e8e;
  padding: 3px 6px;
}

th {
  background: #6f63b6;
  color: #fff;
  text-align: center;
}

tr.department td {
  background: #d9e2f3;
  font-weight: 700;
}

tr.employee td {
  background: #eeeeee;
  font-weight: 700;
}

tr.totals td {
  background: #e6e6e6;
  font-weight: 700;
}

tr.department-total td {
  background: #c5d4ea;
  font-weight: 700;
}

tr.grand td {
  background: #1f4e9b;
  color: #fff;
  font-weight: 700;
}

.num {
  text-align: right;
}

.center {
  text-align: center;
}
</style>
