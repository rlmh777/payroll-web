<template>
  <div class="bank-upload-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Generate Bank Upload</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Create a bank salary upload CSV for a posted payroll run.
    </div>

    <q-banner v-if="reportsStore.error" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      <div class="text-weight-medium">Unable to load report</div>
      <div class="text-caption">{{ reportsStore.error }}</div>
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Payroll run selection</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <PayPeriodGroupSelect
              v-model="selectedPayPeriodGroupId"
              label="Pay period group"
              :clearable="false"
              :show-add-new="false"
              :show-edit="false"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-select
              v-model="selectedPayrollRunId"
              outlined
              emit-value
              map-options
              label="Processed payroll run"
              :loading="isLoadingPayRunSetup"
              :options="processedPayrollRunOptions"
              :disable="!selectedPayPeriodGroupId"
            >
              <template #prepend><q-icon name="task_alt" /></template>
              <template #no-option>
                <q-item>
                  <q-item-section class="text-grey-7">
                    No processed payroll runs found for this pay period group.
                  </q-item-section>
                </q-item>
              </template>
              <template #option="scope">
                <q-item v-bind="scope.itemProps">
                  <q-item-section>
                    <q-item-label>{{ scope.opt.label }}</q-item-label>
                    <q-item-label caption>{{ scope.opt.caption }}</q-item-label>
                  </q-item-section>
                </q-item>
              </template>
            </q-select>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="report" flat bordered>
      <q-card-section>
        <div class="row items-center q-col-gutter-md q-mb-md">
          <div class="col-grow">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-3">
                <div class="text-caption text-grey-7">Pay period group</div>
                <div class="text-body1 text-weight-medium">{{ report.payPeriodGroupName ?? '—' }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-grey-7">Pay period</div>
                <div class="text-body1 text-weight-medium">{{ formatDateRange(report) }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-grey-7">Payroll number</div>
                <div class="text-body1 text-weight-medium">{{ report.payrollNumberLabel }}</div>
              </div>
              <div class="col-12 col-md-3">
                <div class="text-caption text-grey-7">Branch number</div>
                <div class="text-body1 text-weight-medium">{{ report.branchNumber || '—' }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="download"
              label="Download CSV"
              :disable="!report.rows.length"
              @click="downloadCsv"
            />
          </div>
        </div>

        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">Rows</div>
            <div class="text-body1">{{ report.totals.rowCount }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-caption text-grey-7">Total net pay</div>
            <div class="text-body1">{{ formatMoney(report.totals.netPay) }}</div>
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No deposit rows found. Employees need a bank account number and net pay greater than zero.
        </q-banner>

        <q-table
          v-else
          :rows="report.rows"
          :columns="columns"
          row-key="csvLine"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingBankUpload"
          :pagination="{ rowsPerPage: 50 }"
        >
          <template #body-cell-netPay="props">
            <q-td :props="props" class="text-right">
              {{ formatMoney(props.row.netPay) }}
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
import PayPeriodGroupSelect from '@payroll/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from '../attendance/utils';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { usePayPeriodGroupStore } from '@payroll/stores/pay-period-group-store';
import { useReportsStore, type BankUploadReport } from '@payroll/stores/reports-store';

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();

const { payrollRuns, isLoadingPayPeriods, isLoadingPayrollRuns } = storeToRefs(attendanceStore);
const { bankUploadReport: report } = storeToRefs(reportsStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);

const isLoadingPayRunSetup = computed(
  () => isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
);

const processedPayrollRunOptions = computed(() =>
  payrollRuns.value
    .filter((run) => run.status.toLowerCase() === 'posted')
    .filter((run) => run.payPeriodSchedule?.payPeriodGroupId === selectedPayPeriodGroupId.value)
    .sort((left, right) =>
      (right.payPeriodSchedule?.startDate ?? '').localeCompare(left.payPeriodSchedule?.startDate ?? ''),
    )
    .map((run) => {
      const schedule = run.payPeriodSchedule;
      const payrollLabel = run.payrollNumberFormatted
        ? `PAYROLL # ${run.payrollNumberFormatted}`
        : 'Processed';

      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : 'Processed payroll run',
        caption: schedule?.payDate
          ? `Pay ${formatDate(schedule.payDate)} · ${payrollLabel}`
          : payrollLabel,
      };
    }),
);

const columns: QTableProps['columns'] = [
  { name: 'transactionType', label: 'Type', field: 'transactionType', align: 'left' },
  { name: 'paymentType', label: 'Code', field: 'paymentType', align: 'left' },
  { name: 'branchNumber', label: 'Branch', field: 'branchNumber', align: 'left' },
  { name: 'accountNumber', label: 'Bank account', field: 'accountNumber', align: 'left', sortable: true },
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left', sortable: true },
  { name: 'netPay', label: 'Net pay', field: 'netPay', align: 'right', sortable: true },
  { name: 'payrollNumberLabel', label: 'Payroll #', field: 'payrollNumberLabel', align: 'left' },
];

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

function formatDateRange(reportData: BankUploadReport): string {
  if (!reportData.payPeriodStartDate || !reportData.payPeriodEndDate) return '—';
  return `${formatDate(reportData.payPeriodStartDate)} - ${formatDate(reportData.payPeriodEndDate)}`;
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

async function loadPayrollSetup() {
  await Promise.all([
    payPeriodGroupStore.fetchPayPeriodGroups(),
    attendanceStore.fetchPayrollRuns(),
    attendanceStore.fetchPayPeriods(),
  ]);
}

function downloadCsv() {
  if (!report.value?.csv) return;

  const blob = new Blob([report.value.csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `bank_upload_${report.value.payrollNumberFormatted}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(selectedPayrollRunId, async (payrollRunId) => {
  if (!payrollRunId) {
    reportsStore.clearBankUploadReport();
    return;
  }

  const ok = await reportsStore.fetchBankUploadReport(payrollRunId);
  if (!ok) {
    $q.notify({
      type: 'negative',
      message: reportsStore.error || 'Failed to generate bank upload.',
      position: 'top',
    });
  }
});

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>
