<template>
  <div class="ss-contributions">
    <div class="text-h5 text-weight-bold q-mb-xs">Social Security Contributions</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Posted payroll, one row per employee for each calendar week in the dates you choose.
      Week No. is the calendar-year week. Entire company uses one organization band. Departments splits the report by department.
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
            <DateField v-model="startDate" label="Start date" required :disable="reportsStore.isLoadingSocialSecurityContributions" />
          </div>
          <div class="col-12 col-md-3">
            <DateField v-model="endDate" label="End date" required :disable="reportsStore.isLoadingSocialSecurityContributions" />
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
              :disable="reportsStore.isLoadingSocialSecurityContributions"
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
              :disable="reportsStore.isLoadingSocialSecurityContributions"
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
              :loading="reportsStore.isLoadingSocialSecurityContributions"
              :disable="!canGenerate"
              @click="generateReport"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="ss-head">
          <div>{{ report.generatedAt }}</div>
          <div class="ss-head__title">{{ report.title }}</div>
          <div class="ss-head__period">
            <span>Year/Month</span>
            <strong>{{ report.yearLabel }}</strong>
            <strong>{{ report.monthLabel }}</strong>
          </div>
        </div>
        <div class="q-mb-sm"><strong>Organization</strong> {{ report.organization }}</div>
        <div class="text-caption text-grey-8 q-mb-md">
          {{ report.scopeLabel }} · {{ report.employeeCount }} employees · {{ report.totals.rowCount }} weekly rows
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

        <div v-else class="ss-contributions__table-wrap">
          <table class="ss-contributions__table">
            <thead>
              <tr>
                <th>Last Name</th>
                <th>First Name</th>
                <th>Social Security Number</th>
                <th>Week No.</th>
                <th>Weekly Earnings</th>
                <th>Employee Contr.</th>
                <th>Employer Contr.</th>
                <th>Total Contribution</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="group in report.groups" :key="group.name">
                <tr class="group">
                  <td colspan="8">{{ group.name }}</td>
                </tr>
                <tr v-for="(row, index) in group.rows" :key="`${row.employeeId}-${row.weekThursday}-${index}`">
                  <td>{{ row.lastName }}</td>
                  <td>{{ row.firstName }}</td>
                  <td>{{ row.socialSecurityNumber }}</td>
                  <td class="center">{{ row.weekNumber }}</td>
                  <td class="num">{{ formatMoney(row.weeklyEarnings) }}</td>
                  <td class="num">{{ formatMoney(row.employeeContribution) }}</td>
                  <td class="num">{{ formatMoney(row.employerContribution) }}</td>
                  <td class="num">{{ formatMoney(row.totalContribution) }}</td>
                </tr>
              </template>
              <tr class="total">
                <td>Total</td>
                <td></td>
                <td></td>
                <td class="center">{{ report.totals.rowCount }}</td>
                <td class="num">{{ formatMoney(report.totals.weeklyEarnings) }}</td>
                <td class="num">{{ formatMoney(report.totals.employeeContribution) }}</td>
                <td class="num">{{ formatMoney(report.totals.employerContribution) }}</td>
                <td class="num">{{ formatMoney(report.totals.totalContribution) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
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
  type SocialSecurityContributionsScope,
  type SocialSecurityContributionsSortKey,
} from '@payroll/stores/reports-store';
import {
  exportSocialSecurityContributionsExcel,
  exportSocialSecurityContributionsPdf,
} from '@payroll/utils/social-security-contributions-export';

const $q = useQuasar();
const reportsStore = useReportsStore();
const departmentStore = useDepartmentStore();
const { socialSecurityContributionsReport: report } = storeToRefs(reportsStore);

const { startDate, endDate } = useSharedReportDates(defaultStartDate, defaultEndDate);
const scope = ref<SocialSecurityContributionsScope>('company');
const departmentIds = ref<number[]>([]);
const sortBy = ref<SocialSecurityContributionsSortKey[]>(['lastName', 'firstName', 'weekNumber']);

const scopeOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Departments', value: 'department' },
];

const sortOptions = [
  { label: 'Last name', value: 'lastName' },
  { label: 'First name', value: 'firstName' },
  { label: 'Week number', value: 'weekNumber' },
  { label: 'Social security number', value: 'socialSecurityNumber' },
  { label: 'Department', value: 'department' },
  { label: 'Weekly earnings', value: 'weeklyEarnings' },
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
  void reportsStore.fetchSocialSecurityContributionsReport({
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
  if (report.value) exportSocialSecurityContributionsExcel(report.value);
}

function handleExportPdf() {
  if (!report.value) return;
  const opened = exportSocialSecurityContributionsPdf(report.value);
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
.ss-head {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: start;
  gap: 12px;
  margin-bottom: 8px;
}

.ss-head__title {
  font-size: 18px;
  font-weight: 700;
  text-align: center;
}

.ss-head__period {
  justify-self: end;
  display: flex;
  gap: 8px;
}

.ss-contributions__table-wrap {
  overflow-x: auto;
}

.ss-contributions__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.ss-contributions__table th,
.ss-contributions__table td {
  border: 1px solid #c00000;
  padding: 3px 6px;
}

.ss-contributions__table th {
  text-align: center;
}

.ss-contributions__table .num {
  text-align: right;
}

.ss-contributions__table .center {
  text-align: center;
}

.ss-contributions__table tr.group td {
  background: #e6d7b8;
  font-weight: 700;
}

.ss-contributions__table tr.total td {
  font-weight: 700;
}
</style>
