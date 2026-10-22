<template>
  <div class="pool-payouts-report">
    <div class="text-h5 text-weight-bold q-mb-xs">Pool payouts</div>
    <div class="text-body2 text-grey-7 q-mb-lg">
      Shares and tip percentages recorded as paid for each employee on each payroll.
    </div>

    <q-banner v-if="errorMessage" rounded class="bg-red-1 text-red-9 q-mb-md">
      <template #avatar><q-icon name="error_outline" /></template>
      {{ errorMessage }}
    </q-banner>

    <q-card flat bordered class="q-mb-lg">
      <q-card-section>
        <div class="text-subtitle1 text-weight-bold q-mb-md">Report period</div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-4">
            <DateField v-model="startDate" label="Start date" required :disable="loading" />
          </div>
          <div class="col-12 col-md-4">
            <DateField v-model="endDate" label="End date" required :disable="loading" />
          </div>
          <div class="col-12 col-md-4">
            <q-btn
              color="primary"
              icon="assessment"
              label="Generate report"
              class="full-width"
              :loading="loading"
              :disable="!startDate || !endDate"
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
            <div class="text-subtitle1 text-weight-bold">
              {{ report.rows.length }} payout lines · ${{ report.totals.amount.toFixed(2) }}
            </div>
            <div class="text-body2 text-grey-7">{{ report.startDate }} to {{ report.endDate }}</div>
          </div>
          <div class="col-12 col-md-auto">
            <q-btn
              outline
              color="primary"
              icon="table_view"
              label="Export Excel"
              :disable="!report.rows.length"
              @click="exportExcel"
            />
          </div>
        </div>

        <q-banner v-if="!report.rows.length" rounded class="bg-grey-2 text-grey-8">
          No pool payouts were recorded for payrolls in this date range. Distribute a pool file, then run this report.
        </q-banner>

        <q-table
          v-else
          flat
          bordered
          dense
          row-key="rowKey"
          :rows="tableRows"
          :columns="columns"
          :rows-per-page-options="[25, 50, 100]"
        />
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import * as XLSX from 'xlsx';
import DateField from '@core/components/common/DateField.vue';
import { useAuthStore } from '@core/stores/auth';
import { useSharedReportDates } from '@payroll/composables/use-report-period';

type PoolPayoutRow = {
  payrollRunId: string;
  payrollNumber?: string | null;
  status?: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  poolName?: string | null;
  poolCode?: string | null;
  employeeId: string;
  employeeCode?: string | null;
  internalCode1?: string | null;
  employeeName: string;
  paidShares?: number | null;
  paidPercent?: number | null;
  amount: number;
};

type PoolPayoutReport = {
  startDate: string;
  endDate: string;
  rows: PoolPayoutRow[];
  totals: { amount: number; employees: number };
};

const $q = useQuasar();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const today = new Date();
const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;
const { startDate, endDate } = useSharedReportDates(() => monthStart, () => monthEnd);
const loading = ref(false);
const errorMessage = ref('');
const report = ref<PoolPayoutReport | null>(null);

const tableRows = computed(() => (report.value?.rows ?? []).map((row, index) => ({
  ...row,
  rowKey: `${row.payrollRunId}:${row.employeeId}:${row.poolCode ?? index}`,
})));

const columns: QTableProps['columns'] = [
  { name: 'payrollNumber', label: 'Payroll', field: (row) => row.payrollNumber || '—', align: 'left' },
  { name: 'period', label: 'Period', field: (row) => [row.periodStart, row.periodEnd].filter(Boolean).join(' – ') || '—', align: 'left' },
  { name: 'status', label: 'Status', field: (row) => row.status || '—', align: 'left' },
  { name: 'poolName', label: 'Pool', field: (row) => row.poolName || row.poolCode || '—', align: 'left' },
  { name: 'employeeCode', label: 'Employee code', field: (row) => row.employeeCode || '—', align: 'left' },
  { name: 'internalCode1', label: 'Internal code 1', field: (row) => row.internalCode1 || '—', align: 'left' },
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' },
  { name: 'paidShares', label: 'Shares paid', field: (row) => row.paidShares == null ? '—' : Number(row.paidShares), align: 'right' },
  { name: 'paidPercent', label: 'Tip % paid', field: (row) => row.paidPercent == null ? '—' : `${Number(row.paidPercent)}%`, align: 'right' },
  { name: 'amount', label: 'Amount paid', field: (row) => Number(row.amount).toFixed(2), align: 'right' },
];

function headers(): HeadersInit {
  const result: HeadersInit = { Accept: 'application/json' };
  if (authStore.token) result.Authorization = `Bearer ${authStore.token}`;
  return result;
}

async function generateReport() {
  if (!startDate.value || !endDate.value) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const params = new URLSearchParams({
      start_date: startDate.value,
      end_date: endDate.value,
    });
    const response = await fetch(`${API_URL}/reports/pool-payouts?${params.toString()}`, {
      headers: headers(),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(typeof body?.message === 'string' ? body.message : 'Failed to generate the pool payout report.');
    }
    report.value = body as PoolPayoutReport;
  } catch (error) {
    report.value = null;
    errorMessage.value = error instanceof Error ? error.message : 'Failed to generate the pool payout report.';
    $q.notify({ color: 'negative', position: 'top', message: errorMessage.value });
  } finally {
    loading.value = false;
  }
}

function exportExcel() {
  if (!report.value?.rows.length) return;
  const sheetRows = [
    ['Payroll', 'Period start', 'Period end', 'Status', 'Pool', 'Employee code', 'Internal code 1', 'Employee', 'Shares paid', 'Tip % paid', 'Amount paid'],
    ...report.value.rows.map((row) => [
      row.payrollNumber ?? '',
      row.periodStart ?? '',
      row.periodEnd ?? '',
      row.status ?? '',
      row.poolName ?? '',
      row.employeeCode ?? '',
      row.internalCode1 ?? '',
      row.employeeName,
      row.paidShares ?? '',
      row.paidPercent ?? '',
      row.amount,
    ]),
  ];
  const worksheet = XLSX.utils.aoa_to_sheet(sheetRows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Pool payouts');
  XLSX.writeFile(workbook, `pool-payouts-${report.value.startDate}-to-${report.value.endDate}.xlsx`);
}
</script>
