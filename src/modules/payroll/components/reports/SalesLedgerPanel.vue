<template>
  <div class="sales-ledger-panel">
    <div class="sales-ledger-toolbar q-mb-md">
      <div class="sales-ledger-view-toggle">
        <q-btn-dropdown
          split
          dense
          no-caps
          :unelevated="viewMode === 'summary'"
          :outline="viewMode !== 'summary'"
          :color="viewMode === 'summary' ? 'primary' : 'grey-8'"
          label="BTS210b"
          :loading="isExporting"
          @click="viewMode = 'summary'"
        >
          <q-list>
            <q-item
              v-close-popup
              clickable
              :disable="!hasSummaryRows || isExporting"
              @click="exportBts210b"
            >
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>Export Sales Ledger Report</q-item-section>
            </q-item>
          </q-list>
        </q-btn-dropdown>
        <q-btn
          v-for="option in secondaryViewOptions"
          :key="option.value"
          :label="option.label"
          no-caps
          dense
          :unelevated="viewMode === option.value"
          :outline="viewMode !== option.value"
          :color="viewMode === option.value ? 'primary' : 'grey-8'"
          @click="viewMode = option.value as ViewMode"
        />
      </div>

      <q-input
        v-if="viewMode !== 'detail'"
        v-model="filterDraft"
        outlined
        dense
        clearable
        :label="filterLabel"
        placeholder="Date, invoice, or name"
        class="sales-ledger-filter"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>

    <q-banner v-if="!hasData" class="bg-blue-1 text-grey-9" rounded>
      Upload the monthly raw sales ledger workbook to view BTS210b or the detail sheet.
      Taxable Sales amounts are GST-exclusive; GST payable = amount × standard rate from settings.
    </q-banner>

    <div v-else class="sales-ledger-table-wrap">
      <q-markup-table flat bordered dense class="sales-ledger-table">
        <thead>
          <tr v-if="viewMode === 'summary'" class="sales-ledger-line-header">
            <th colspan="4" class="text-left text-weight-bold text-uppercase">
              Line # on GST Return
            </th>
            <th
              v-for="line in summaryLineHeaders"
              :key="line"
              class="text-center text-weight-bold text-uppercase"
            >
              {{ line }}
            </th>
          </tr>
          <tr>
            <th
              v-for="column in displayColumns"
              :key="column.key"
              :class="headerClass(column.key)"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in displayRows" :key="rowKey(row, index)">
            <td
              v-for="column in displayColumns"
              :key="column.key"
              :class="cellClass(column.key)"
            >
              <span :class="{ 'text-negative': isNegative(column.key, row) }">
                {{ formatCell(column.key, row) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="viewMode === 'summary' && displayRows.length">
          <tr class="sales-ledger-row--total">
            <td class="text-weight-bold">Total</td>
            <td />
            <td />
            <td />
            <td class="text-right text-weight-bold">{{ money(summaryStandardRatedTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryZeroRatedTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryExemptTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryTotalSuppliesTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryGstPayableTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(0) }}</td>
            <td class="text-right text-weight-bold">{{ money(0) }}</td>
            <td class="text-right text-weight-bold">{{ money(0) }}</td>
          </tr>
        </tfoot>
        <tfoot v-else-if="viewMode === 'non_taxable' && displayRows.length">
          <tr class="sales-ledger-row--total">
            <td class="text-weight-bold">Total</td>
            <td />
            <td />
            <td class="text-right text-weight-bold">{{ money(nonTaxableTotal) }}</td>
          </tr>
        </tfoot>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  type TaxCalculatorPurchaseLedgerSheet,
} from '@payroll/stores/tax-calculator-store';
import { useOrganizationStore } from '@core/stores/organization-store';
import { exportBts210bSalesLedger } from '@payroll/utils/bts210b-sales-ledger-export';
import {
  salesClassBucket,
  summarizeBts210bInvoice,
} from '@payroll/utils/bts210b-sales-ledger-summary';

type ViewMode = 'summary' | 'non_taxable' | 'detail';

type InvoiceGroup = {
  date: string | number;
  date_sort: number;
  invoice_no: string;
  name: string;
  taxable_exclusive: number;
  exempt: number;
  non_taxable: number;
  zero_rated: number;
};

type SummaryRow = {
  date: string | number;
  date_sort: number;
  invoice_no: string;
  name: string;
  tin: string;
  standard_rated: number;
  zero_rated: number;
  exempt: number;
  total_supplies: number;
  gst_payable: number;
  debit_credit_notes: number;
  gob_contracts: number;
  gst_withheld_gob: number;
  non_taxable: number;
};

type DetailRow = Record<string, string | number | boolean | null | undefined> & { row: number };

const props = defineProps<{
  sheet: TaxCalculatorPurchaseLedgerSheet;
  gstRate?: number;
  year: number;
  month: number;
}>();

const $q = useQuasar();
const organizationStore = useOrganizationStore();

const viewMode = ref<ViewMode>('summary');
const isExporting = ref(false);
const filterDraft = ref('');
const filterValue = ref('');
let filterTimer: ReturnType<typeof setTimeout> | null = null;

const summaryLineHeaders = [
  'Line 100',
  'Line 110',
  'Line 120',
  'Line 130',
  'Line 140',
  'Line 150',
  '',
  'Line 380',
] as const;

const secondaryViewOptions = [
  { label: 'Non Taxable', value: 'non_taxable' },
  { label: 'Raw Data', value: 'detail' },
];

const gstRate = computed(() => {
  const rate = Number(props.gstRate ?? 0.125);
  return rate > 0 ? rate : 0.125;
});

const hasData = computed(() => props.sheet.rows.length > 0);
const classColumn = computed(() => props.sheet.class_column || 'B');
const dateColumn = computed(() => props.sheet.date_column || 'C');
const invoiceColumn = computed(() => props.sheet.invoice_column || 'E');
const nameColumn = computed(() => props.sheet.name_column || 'G');
const debitColumn = computed(() => props.sheet.debit_column || 'I');
const creditColumn = computed(() => props.sheet.credit_column || 'K');

const filterLabel = computed(() => {
  if (viewMode.value === 'summary') return 'Filter BTS210b';
  if (viewMode.value === 'non_taxable') return 'Filter Non Taxable';
  return 'Filter';
});

watch(filterDraft, (value) => {
  if (filterTimer) clearTimeout(filterTimer);
  filterTimer = setTimeout(() => {
    filterValue.value = value.trim().toLowerCase();
  }, 200);
});

onBeforeUnmount(() => {
  if (filterTimer) clearTimeout(filterTimer);
});

function lineAmount(row: DetailRow): number {
  return Number(row[creditColumn.value] ?? 0) - Number(row[debitColumn.value] ?? 0);
}

function isDataRow(row: DetailRow): boolean {
  if ((row.row ?? 0) <= 1) return false;
  if (row.is_section || row.is_total) return false;
  const cls = String(row[classColumn.value] ?? '');
  if (salesClassBucket(cls) === 'total') return false;
  const date = row[dateColumn.value];
  const invoice = row[invoiceColumn.value];
  return date != null && date !== '' || invoice != null && invoice !== '';
}

const detailRows = computed(() => props.sheet.rows.filter((row) => isDataRow(row as DetailRow)) as DetailRow[]);

const groupedInvoices = computed(() => {
  const groups = new Map<string, InvoiceGroup>();

  for (const row of props.sheet.rows) {
    if (!isDataRow(row as DetailRow)) continue;
    const cls = String(row[classColumn.value] ?? '');
    const bucket = salesClassBucket(cls);
    if (bucket === 'total' || bucket === 'other') continue;

    const date = row[dateColumn.value] ?? '';
    const invoiceNo = String(row[invoiceColumn.value] ?? '').trim();
    const name = String(row[nameColumn.value] ?? '').trim();
    const amount = lineAmount(row as DetailRow);
    if (!Number.isFinite(amount) || amount === 0) continue;

    const dateSort = Number(date);
    const key = `${String(date)}\u0000${invoiceNo}`;
    const existing = groups.get(key) ?? {
      date,
      date_sort: Number.isFinite(dateSort) ? dateSort : Number.POSITIVE_INFINITY,
      invoice_no: invoiceNo,
      name,
      taxable_exclusive: 0,
      exempt: 0,
      non_taxable: 0,
      zero_rated: 0,
    };

    if (!existing.name && name) existing.name = name;
    if (bucket === 'taxable') existing.taxable_exclusive += amount;
    else if (bucket === 'exempt') existing.exempt += amount;
    else if (bucket === 'non_taxable') existing.non_taxable += amount;
    else if (bucket === 'zero_rated') existing.zero_rated += amount;

    groups.set(key, existing);
  }

  return [...groups.values()];
});

function toSummaryRow(row: InvoiceGroup): SummaryRow {
  const amounts = summarizeBts210bInvoice(
    {
      taxable_exclusive: row.taxable_exclusive,
      exempt: row.exempt,
      non_taxable: row.non_taxable,
      zero_rated: row.zero_rated,
    },
    gstRate.value,
  );

  return {
    date: row.date,
    date_sort: row.date_sort,
    invoice_no: row.invoice_no,
    name: row.name,
    tin: '',
    ...amounts,
    non_taxable: row.non_taxable,
  };
}

function sortRows<T extends { date_sort: number; invoice_no: string; name: string }>(rows: T[]) {
  return [...rows].sort((a, b) => (
    a.date_sort - b.date_sort
    || a.invoice_no.localeCompare(b.invoice_no, undefined, { numeric: true })
    || a.name.localeCompare(b.name)
  ));
}

const summaryRows = computed(() => sortRows(
  groupedInvoices.value
    .filter((row) => row.taxable_exclusive !== 0 || row.exempt !== 0 || row.zero_rated !== 0)
    .map(toSummaryRow),
));

const nonTaxableRows = computed(() => sortRows(
  groupedInvoices.value
    .filter((row) => row.non_taxable !== 0)
    .map(toSummaryRow),
));

function matchesFilter(row: { date: string | number; invoice_no: string; name: string }, needle: string) {
  if (!needle) return true;
  const dateLabel = formatSummaryDate(row.date).toLowerCase();
  return (
    dateLabel.includes(needle)
    || row.invoice_no.toLowerCase().includes(needle)
    || row.name.toLowerCase().includes(needle)
  );
}

const filteredSummaryRows = computed(() => {
  const needle = filterValue.value;
  if (!needle) return summaryRows.value;
  return summaryRows.value.filter((row) => matchesFilter(row, needle));
});

const filteredNonTaxableRows = computed(() => {
  const needle = filterValue.value;
  if (!needle) return nonTaxableRows.value;
  return nonTaxableRows.value.filter((row) => matchesFilter(row, needle));
});

const hasSummaryRows = computed(() => summaryRows.value.length > 0);

const displayRows = computed(() => {
  if (viewMode.value === 'summary') return filteredSummaryRows.value;
  if (viewMode.value === 'non_taxable') return filteredNonTaxableRows.value;
  return detailRows.value;
});

const displayColumns = computed(() => {
  if (viewMode.value === 'summary') {
    return [
      { key: 'date', label: 'Invoice Date' },
      { key: 'invoice_no', label: 'Invoice No.' },
      { key: 'name', label: "Buyer's Name" },
      { key: 'tin', label: "Buyer's TIN" },
      { key: 'standard_rated', label: 'Value of Standard Rated Supplies (GST Exclusive)' },
      { key: 'zero_rated', label: 'Value of Zero Rated Supplies (GST Exclusive)' },
      { key: 'exempt', label: 'Value of Exempt Supplies' },
      { key: 'total_supplies', label: 'Total Supplies' },
      { key: 'gst_payable', label: 'GST Payable on Standard Rated Supplies' },
      { key: 'debit_credit_notes', label: 'Debit / Credit Notes' },
      { key: 'gob_contracts', label: 'Value of GOB Contracts' },
      { key: 'gst_withheld_gob', label: 'GST Withheld on GOB Contracts' },
    ];
  }

  if (viewMode.value === 'non_taxable') {
    return [
      { key: 'date', label: 'Date' },
      { key: 'invoice_no', label: 'Invoice No' },
      { key: 'name', label: 'Name' },
      { key: 'non_taxable', label: 'Non-Taxable Sales' },
    ];
  }

  return [
    { key: 'row', label: '#' },
    { key: classColumn.value, label: 'Class' },
    { key: dateColumn.value, label: 'Date' },
    { key: invoiceColumn.value, label: 'Invoice No' },
    { key: nameColumn.value, label: 'Name' },
    { key: debitColumn.value, label: 'Debit' },
    { key: creditColumn.value, label: 'Credit' },
  ];
});

const summaryStandardRatedTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.standard_rated, 0),
);
const summaryZeroRatedTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.zero_rated, 0),
);
const summaryExemptTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.exempt, 0),
);
const summaryTotalSuppliesTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.total_supplies, 0),
);
const summaryGstPayableTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.gst_payable, 0),
);
const nonTaxableTotal = computed(() =>
  filteredNonTaxableRows.value.reduce((sum, row) => sum + row.non_taxable, 0),
);

function money(value: number | null | undefined) {
  return new Intl.NumberFormat('en-BZ', { style: 'currency', currency: 'BZD' }).format(Number(value ?? 0));
}

function formatSummaryDate(value: string | number) {
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 20000 && numeric < 80000) {
    const date = new Date(Date.UTC(1899, 11, 30));
    date.setUTCDate(date.getUTCDate() + Math.round(numeric));
    return date.toLocaleDateString('en-GB', { timeZone: 'UTC' });
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10).split('-').reverse().join('/');
  }
  return String(value ?? '');
}

function cellValue(row: SummaryRow | DetailRow, column: string): string | number | boolean | null | undefined {
  const value: unknown = Reflect.get(row, column);
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return value;
  }
  return undefined;
}

function formatCellValue(value: string | number | boolean | null | undefined): string {
  if (value == null) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function formatCell(column: string, row: SummaryRow | DetailRow) {
  if (column === 'date' || column === dateColumn.value) {
    const value = 'date' in row ? row.date : row[dateColumn.value];
    return formatSummaryDate(value as string | number);
  }
  if (column === 'row') return formatCellValue((row as DetailRow).row);
  if (
    column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'total_supplies'
    || column === 'gst_payable'
    || column === 'debit_credit_notes'
    || column === 'gob_contracts'
    || column === 'gst_withheld_gob'
    || column === 'non_taxable'
    || column === debitColumn.value
    || column === creditColumn.value
  ) {
    const value = Number(cellValue(row, column) ?? 0);
    if (viewMode.value === 'detail' && (value === 0 || !Number.isFinite(value))) {
      const raw = cellValue(row, column);
      return raw == null || raw === '' ? '' : money(Number(raw));
    }
    return money(value);
  }
  return formatCellValue(cellValue(row, column));
}

function isNegative(column: string, row: SummaryRow | DetailRow) {
  if (
    column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'total_supplies'
    || column === 'gst_payable'
    || column === 'non_taxable'
    || column === debitColumn.value
    || column === creditColumn.value
  ) {
    return Number(cellValue(row, column) ?? 0) < 0;
  }
  return false;
}

function headerClass(column: string) {
  if (
    column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'total_supplies'
    || column === 'gst_payable'
    || column === 'debit_credit_notes'
    || column === 'gob_contracts'
    || column === 'gst_withheld_gob'
    || column === 'non_taxable'
    || column === debitColumn.value
    || column === creditColumn.value
    || column === 'row'
  ) {
    return 'text-right';
  }
  return 'text-left';
}

function cellClass(column: string) {
  return headerClass(column);
}

function rowKey(row: SummaryRow | DetailRow, index: number) {
  if ('invoice_no' in row) return `${row.date}-${row.invoice_no}-${index}`;
  return `detail-${row.row}-${index}`;
}

onMounted(() => {
  if (!organizationStore.organizations.length) {
    void organizationStore.fetchOrganizations();
  }
});

async function exportBts210b() {
  if (!hasSummaryRows.value) {
    $q.notify({ type: 'negative', message: 'There are no BTS210b rows to export.' });
    return;
  }
  isExporting.value = true;
  try {
    if (!organizationStore.organizationToEdit && !organizationStore.organizations.length) {
      await organizationStore.fetchOrganizations();
    }
    const organization = organizationStore.organizationToEdit ?? organizationStore.organizations[0];
    await exportBts210bSalesLedger({
      rows: summaryRows.value,
      year: props.year,
      month: props.month,
      companyTin: organization?.taxIdentificationNumber?.trim() ?? '',
      companyName: (organization?.legalName || organization?.alias || '').trim(),
    });
    $q.notify({ type: 'positive', message: 'BTS210b sales ledger exported.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to export BTS210b.',
    });
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
.sales-ledger-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  gap: 8px;
}

.sales-ledger-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.sales-ledger-view-toggle {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.sales-ledger-filter {
  min-width: 240px;
  flex: 1 1 240px;
  max-width: 360px;
}

.sales-ledger-table-wrap {
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
}

.sales-ledger-table {
  width: 100%;
}

.sales-ledger-table thead th {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #fff;
  white-space: nowrap;
}

.sales-ledger-line-header th {
  top: 0;
  font-size: 11px;
}

.sales-ledger-row--total td {
  background: #f5f7fa;
}

.text-negative {
  color: #c10015;
}
</style>
