<template>
  <div class="journal-entries-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Journal Entries</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      View payroll journal entry lines by account for a processed payroll run.
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
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period group</div>
                <div class="text-body1 text-weight-medium">{{ report.payPeriodGroupName ?? '—' }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period date range</div>
                <div class="text-body1 text-weight-medium">{{ formatDateRange(report) }}</div>
              </div>
              <div class="col-12 col-md-4">
                <div class="text-caption text-grey-7">Pay period number</div>
                <div class="text-body1 text-weight-medium">{{ report.payPeriodNumber }}</div>
              </div>
            </div>
          </div>
          <div class="col-12 col-md-auto">
            <div class="row q-gutter-sm justify-end">
              <q-btn
                outline
                color="primary"
                icon="picture_as_pdf"
                label="Export PDF"
                :disable="!report.rows.length"
                @click="handleExportPdf"
              />
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
        </div>

        <q-table
          :rows="report.rows"
          :columns="columns"
          :row-key="(row) => row.accountId ?? row.accountNumber"
          flat
          bordered
          dense
          :loading="reportsStore.isLoadingJournalEntries"
          no-data-label="No journal entry lines found for this payroll run."
        >
          <template #body-cell-debit="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.row.debit) }}
            </q-td>
          </template>
          <template #body-cell-credit="props">
            <q-td :props="props" class="text-right">
              {{ formatCurrency(props.row.credit) }}
            </q-td>
          </template>
          <template #bottom-row>
            <q-tr class="journal-entries-report__totals-row">
              <q-td colspan="2" class="text-right text-weight-bold">Totals</q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatCurrency(report.totals.debit) }}
              </q-td>
              <q-td class="text-right text-weight-bold">
                {{ formatCurrency(report.totals.credit) }}
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
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import type { QTableProps } from 'quasar';
import PayPeriodGroupSelect from 'src/components/payroll/pay-period-groups/PayPeriodGroupSelect.vue';
import { formatDate } from 'src/components/attendance/utils';
import { useAttendanceStore } from 'src/stores/attendance-store';
import { usePayPeriodGroupStore } from 'src/stores/pay-period-group-store';
import { useReportsStore, type JournalEntryReport } from 'src/stores/reports-store';
import {
  exportJournalEntriesExcel,
  exportJournalEntriesPdf,
} from 'src/utils/journal-entries-export';

const $q = useQuasar();

const attendanceStore = useAttendanceStore();
const payPeriodGroupStore = usePayPeriodGroupStore();
const reportsStore = useReportsStore();

const {
  payrollRuns,
  isLoadingPayPeriods,
  isLoadingPayrollRuns,
} = storeToRefs(attendanceStore);

const { journalEntryReport: report } = storeToRefs(reportsStore);

const selectedPayPeriodGroupId = ref<string | null>(null);
const selectedPayrollRunId = ref<string | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'accountNumber', label: 'Account number', field: 'accountNumber', align: 'left', sortable: true },
  { name: 'accountDescription', label: 'Account description', field: 'accountDescription', align: 'left', sortable: true },
  { name: 'debit', label: 'Debit', field: 'debit', align: 'right', sortable: true },
  { name: 'credit', label: 'Credit', field: 'credit', align: 'right', sortable: true },
];

const isLoadingPayRunSetup = computed(() =>
  isLoadingPayPeriods.value || isLoadingPayrollRuns.value || payPeriodGroupStore.isLoadingPayPeriodGroups,
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

      return {
        value: run.id,
        label: schedule
          ? `${formatDate(schedule.startDate)} - ${formatDate(schedule.endDate)}`
          : 'Processed payroll run',
        caption: schedule?.payDate
          ? `Pay ${formatDate(schedule.payDate)} · Processed`
          : 'Processed',
      };
    }),
);

function resolveDefaultPayPeriodGroupId(): string | null {
  return payPeriodGroupStore.payPeriodGroups.find((group) => group.isDefault)?.id
    ?? payPeriodGroupStore.payPeriodGroups.find((group) => group.status === 'active')?.id
    ?? payPeriodGroupStore.payPeriodGroups[0]?.id
    ?? null;
}

function formatDateRange(reportData: JournalEntryReport): string {
  return `${formatDate(reportData.payPeriodStartDate)} - ${formatDate(reportData.payPeriodEndDate)}`;
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
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

function handleExportExcel() {
  if (!report.value) {
    return;
  }

  exportJournalEntriesExcel(report.value);
  $q.notify({ type: 'positive', message: 'Journal entries exported to Excel.' });
}

function handleExportPdf() {
  if (!report.value) {
    return;
  }

  const opened = exportJournalEntriesPdf(report.value);
  if (!opened) {
    $q.notify({
      type: 'negative',
      message: 'Unable to open PDF export. Allow pop-ups for this site and try again.',
    });
    return;
  }

  $q.notify({ type: 'positive', message: 'Journal entries opened for PDF export.' });
}

watch(selectedPayPeriodGroupId, () => {
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});

watch(selectedPayrollRunId, async (payrollRunId) => {
  reportsStore.clearJournalEntryReport();

  if (!payrollRunId) {
    return;
  }

  await reportsStore.fetchJournalEntriesReport(payrollRunId);
});

onMounted(async () => {
  await loadPayrollSetup();
  selectedPayPeriodGroupId.value = resolveDefaultPayPeriodGroupId();
  selectedPayrollRunId.value = processedPayrollRunOptions.value[0]?.value ?? null;
});
</script>

<style scoped>
.journal-entries-report__totals-row {
  background: rgba(0, 0, 0, 0.03);
}
</style>
