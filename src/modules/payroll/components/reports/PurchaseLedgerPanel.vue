<template>
  <div class="purchase-ledger-panel">
    <div class="purchase-ledger-toolbar q-mb-md">
      <div class="purchase-ledger-view-toggle">
        <q-btn-dropdown
          split
          dense
          no-caps
          :unelevated="viewMode === 'summary'"
          :outline="viewMode !== 'summary'"
          :color="viewMode === 'summary' ? 'primary' : 'grey-8'"
          label="BTS210a"
          :loading="isExporting"
          @click="viewMode = 'summary'"
        >
          <q-list>
            <q-item
              v-close-popup
              clickable
              :disable="!hasData || isExporting"
              @click="exportBts210a"
            >
              <q-item-section avatar>
                <q-icon name="file_download" />
              </q-item-section>
              <q-item-section>Export</q-item-section>
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
        v-if="viewMode === 'summary' || viewMode === 'non_taxable'"
        v-model="summaryFilterDraft"
        outlined
        dense
        clearable
        :loading="isSummaryFiltering"
        :label="viewMode === 'summary' ? 'Filter BTS210a' : 'Filter Non Taxable'"
        placeholder="Date, invoice, name, or TIN"
        class="purchase-ledger-filter"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-select
        v-model="selectedExclusion"
        :options="filteredNameOptions"
        use-input
        fill-input
        hide-selected
        input-debounce="200"
        emit-value
        map-options
        outlined
        dense
        clearable
        label="Exclude company name"
        class="purchase-ledger-exclude"
        option-label="label"
        option-value="value"
        :loading="store.isSavingPurchaseLedgerExclusion"
        @filter="filterNameOptions"
        @update:model-value="addExclusion"
      />
    </div>

    <div v-if="excludedNames.length" class="q-mb-md">
      <div class="text-caption text-grey-7 q-mb-xs">Excluded companies</div>
      <div class="row q-gutter-xs">
        <q-chip
          v-for="item in excludedNames"
          :key="item.id"
          removable
          color="grey-3"
          text-color="grey-9"
          :disable="store.isSavingPurchaseLedgerExclusion"
          @remove="removeExclusion(item.id)"
        >
          {{ item.name }}
        </q-chip>
      </div>
    </div>

    <q-banner v-if="!hasData" class="bg-blue-1 text-grey-9" rounded>
      Upload the monthly purchase ledger workbook to view the BTS210a summary or the full detail sheet.
    </q-banner>

    <div
      v-else
      class="purchase-ledger-table-wrap"
      :class="{ 'purchase-ledger-table-wrap--summary': viewMode === 'summary' }"
    >
      <q-markup-table flat bordered dense class="purchase-ledger-table">
        <thead>
          <tr v-if="viewMode === 'summary'" class="purchase-ledger-line-header">
            <th colspan="5" class="text-left text-weight-bold text-uppercase">
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
            <th v-if="viewMode === 'detail'" class="purchase-ledger-row-num text-right">#</th>
            <th
              v-for="column in displayColumns"
              :key="column.key"
              :class="[headerClass(column.key), viewMode === 'summary' ? 'text-uppercase' : '']"
            >
              {{ column.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in displayRows"
            :key="rowKey(row, index)"
            :class="rowClass(row)"
          >
            <td v-if="viewMode === 'detail'" class="purchase-ledger-row-num text-right text-grey-7">
              {{ 'row' in row ? row.row : '' }}
            </td>
            <td
              v-for="column in displayColumns"
              :key="column.key"
              :class="cellClass(column.key)"
            >
              <template v-if="column.key === 'total_purchases' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.total_purchases < 0 }">
                  {{ money(row.total_purchases) }}
                </span>
              </template>
              <template v-else-if="column.key === 'imports' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.imports < 0 }">
                  {{ money(row.imports) }}
                </span>
              </template>
              <template v-else-if="column.key === 'standard_rated' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.standard_rated < 0 }">
                  {{ money(row.standard_rated) }}
                </span>
              </template>
              <template v-else-if="column.key === 'zero_rated' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.zero_rated < 0 }">
                  {{ money(row.zero_rated) }}
                </span>
              </template>
              <template v-else-if="column.key === 'exempt' && isSummaryRow(row)">
                <span
                  :class="{
                    'text-negative': row.exempt < 0,
                    'purchase-ledger-calculated--adjusted': row.partial_adjusted,
                  }"
                >
                  {{ money(row.exempt) }}
                </span>
              </template>
              <template v-else-if="column.key === 'imported_gst' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.imported_gst < 0 }">
                  {{ money(row.imported_gst) }}
                </span>
              </template>
              <template v-else-if="column.key === 'domestic_gst' && isSummaryRow(row)">
                <span
                  :class="{
                    'text-negative': row.domestic_gst < 0,
                    'purchase-ledger-calculated--adjusted': row.partial_adjusted,
                  }"
                >
                  {{ money(row.domestic_gst) }}
                </span>
              </template>
              <template v-else-if="column.key === 'debit_credit_notes' && isSummaryRow(row)">
                <span :class="{ 'text-negative': row.debit_credit_notes < 0 }">
                  {{ money(row.debit_credit_notes) }}
                </span>
              </template>
              <template v-else-if="column.key === 'total_input_tax' && isSummaryRow(row)">
                <span
                  :class="{
                    'text-negative': row.total_input_tax < 0,
                    'purchase-ledger-calculated--adjusted': row.partial_adjusted,
                  }"
                >
                  {{ money(row.total_input_tax) }}
                </span>
              </template>
              <span v-else :class="{ 'text-negative': isNegative(column.key, row) }">
                {{ formatCell(column.key, row) }}
              </span>
            </td>
          </tr>
        </tbody>
        <tfoot v-if="viewMode === 'summary' && displayRows.length">
          <tr class="purchase-ledger-row--total">
            <td class="text-weight-bold">Total</td>
            <td />
            <td />
            <td />
            <td class="text-right text-weight-bold">{{ money(summaryPurchasesTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryImportsTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryStandardRatedTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryZeroRatedTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryExemptTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryImportedGstTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryDomesticGstTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryDebitCreditNotesTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryTotalInputTaxTotal) }}</td>
          </tr>
        </tfoot>
        <tfoot v-else-if="viewMode === 'non_taxable' && displayRows.length">
          <tr class="purchase-ledger-row--total">
            <td class="text-weight-bold">Total</td>
            <td />
            <td />
            <td />
            <td class="text-right text-weight-bold">{{ money(nonTaxablePurchasesTotal) }}</td>
          </tr>
        </tfoot>
      </q-markup-table>
      <q-inner-loading :showing="(viewMode === 'summary' || viewMode === 'non_taxable') && isSummaryFiltering" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useTaxCalculatorStore,
  type TaxCalculatorGstSheetRow,
  type TaxCalculatorPurchaseLedgerExcludedName,
  type TaxCalculatorPurchaseLedgerSheet,
} from '@payroll/stores/tax-calculator-store';
import { useOrganizationStore } from '@core/stores/organization-store';
import { exportBts210aPurchaseLedger } from '@payroll/utils/bts210a-purchase-ledger-export';

type ViewMode = 'summary' | 'non_taxable' | 'detail';
type InvoiceGroup = {
  date: string | number;
  date_sort: number;
  invoice_no: string;
  name: string;
  tin: string;
  non_taxable: number;
  taxable: number;
  partial_raw: number;
  imported: number;
  zero_rated: number;
  exempt: number;
  imported_gst: number;
  gst: number;
  debit_credit_notes: number;
  other: number;
  all_classes: number;
  has_other_class: boolean;
};
type SummaryRow = {
  date: string | number;
  date_sort: number;
  invoice_no: string;
  name: string;
  tin: string;
  total_purchases: number;
  imports: number;
  standard_rated: number;
  zero_rated: number;
  exempt: number;
  imported_gst: number;
  domestic_gst: number;
  debit_credit_notes: number;
  total_input_tax: number;
  partial_adjusted: boolean;
};
type DisplayRow = TaxCalculatorGstSheetRow | SummaryRow;
type TaxClassBucket = 'non_taxable' | 'taxable' | 'partial' | 'imported' | 'imported_gst' | 'gst' | 'zero_rated' | 'exempt' | 'debit_credit_notes' | 'other';

const props = defineProps<{
  sheet: TaxCalculatorPurchaseLedgerSheet;
  excludedNames: TaxCalculatorPurchaseLedgerExcludedName[];
  taxableRatio?: number;
  complementRatio?: number;
  gstRate?: number;
  year: number;
  month: number;
}>();

const store = useTaxCalculatorStore();
const organizationStore = useOrganizationStore();
const $q = useQuasar();
const viewMode = ref<ViewMode>('summary');
const isExporting = ref(false);
const selectedExclusion = ref<string | null>(null);
const summaryFilterDraft = ref('');
const summaryFilter = ref('');
const isSummaryFiltering = ref(false);
let summaryFilterTimer: ReturnType<typeof setTimeout> | null = null;
const SUMMARY_FILTER_DEBOUNCE_MS = 200;

watch(summaryFilterDraft, (value) => {
  const next = value ?? '';
  isSummaryFiltering.value = true;
  if (summaryFilterTimer) clearTimeout(summaryFilterTimer);
  summaryFilterTimer = setTimeout(() => {
    summaryFilter.value = next;
    requestAnimationFrame(() => {
      isSummaryFiltering.value = false;
      summaryFilterTimer = null;
    });
  }, SUMMARY_FILTER_DEBOUNCE_MS);
});

onBeforeUnmount(() => {
  if (summaryFilterTimer) clearTimeout(summaryFilterTimer);
});

const summaryLineHeaders = [
  'Line 200',
  'Line 210',
  'Line 220',
  'Line 230',
  'Line 240',
  'Line 250',
  'Line 260',
  'Line 270',
] as const;

const viewOptions = [
  { label: 'BTS210a', value: 'summary' },
  { label: 'Non Taxable', value: 'non_taxable' },
  { label: 'Raw Data', value: 'detail' },
];
const secondaryViewOptions = viewOptions.filter((option) => option.value !== 'summary');

const taxableRatio = computed(() => Number(props.taxableRatio ?? 0));
const partialFactor = computed(() => {
  if (props.complementRatio != null && Number.isFinite(Number(props.complementRatio))) {
    return Math.max(0, Number(props.complementRatio));
  }
  return Math.max(0, 1 - taxableRatio.value);
});

const excludedNameSet = computed(() => new Set(
  props.excludedNames.map((item) => item.name.trim().toLowerCase()),
));

const hasData = computed(() => props.sheet.rows.length > 0);
const nameColumn = computed(() => props.sheet.name_column || 'F');
const classColumn = computed(() => props.sheet.class_column || 'L');
const debitColumn = computed(() => props.sheet.debit_column || 'N');
const dateColumn = computed(() => props.sheet.date_column || 'B');
const tinColumn = computed(() => props.sheet.tin_column || 'J');
const invoiceColumn = computed(() => props.sheet.invoice_column || 'D');

const headerRow = computed(() => props.sheet.rows.find((row) => row.row === 1) ?? null);

const detailRows = computed(() => props.sheet.rows.filter((row) => {
  if (row.row === 1) return true;
  const name = String(row[nameColumn.value] ?? '').trim();
  if (!name) return true;
  return !excludedNameSet.value.has(name.toLowerCase());
}));

const groupedInvoices = computed(() => {
  const groups = new Map<string, InvoiceGroup>();
  let carryDate: string | number = '';
  let carryInvoice = '';
  let carryName = '';
  let carryTin = '';
  let carryClass = '';

  for (const row of props.sheet.rows) {
    if (row.row === 1) continue;
    if (isPeriodMarkerRow(row)) {
      carryDate = '';
      carryInvoice = '';
      carryName = '';
      carryTin = '';
      carryClass = '';
      continue;
    }

    const rawName = String(row[nameColumn.value] ?? '').trim();
    const rawTin = String(row[tinColumn.value] ?? '').trim();
    const rawClass = String(row[classColumn.value] ?? '').trim();
    const rawInvoice = String(row[invoiceColumn.value] ?? '').trim();
    const rawDate = row[dateColumn.value];
    const hasDate = rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== '';

    if (hasDate) carryDate = rawDate;
    if (rawInvoice) carryInvoice = rawInvoice;
    if (rawName) carryName = rawName;
    if (rawTin) carryTin = rawTin;
    if (rawClass) carryClass = rawClass;

    const name = rawName || carryName;
    const tin = stripLeadingTinPrefix(rawTin || carryTin);
    const cls = rawClass || carryClass;
    const invoiceNo = rawInvoice || carryInvoice;
    const date = hasDate ? rawDate : carryDate;

    if (!name || excludedNameSet.value.has(name.toLowerCase())) continue;
    const debit = Number(row[debitColumn.value] ?? 0);
    if (!Number.isFinite(debit) || debit === 0) continue;

    const dateSort = Number(date);
    const key = `${String(date)}\u0000${invoiceNo}`;
    const existing = groups.get(key) ?? {
      date,
      date_sort: Number.isFinite(dateSort) ? dateSort : Number.POSITIVE_INFINITY,
      invoice_no: invoiceNo,
      name,
      tin,
      non_taxable: 0,
      taxable: 0,
      partial_raw: 0,
      imported: 0,
      zero_rated: 0,
      exempt: 0,
      imported_gst: 0,
      gst: 0,
      debit_credit_notes: 0,
      other: 0,
      all_classes: 0,
      has_other_class: false,
    };

    if (!existing.name && name) existing.name = name;
    if (!existing.tin && tin) existing.tin = tin;
    if (!existing.invoice_no && invoiceNo) existing.invoice_no = invoiceNo;

    existing.all_classes += debit;

    const bucket = taxClassBucket(cls);
    if (bucket === 'non_taxable') existing.non_taxable += debit;
    else {
      existing.has_other_class = true;
      if (bucket === 'taxable') existing.taxable += debit;
      else if (bucket === 'partial') existing.partial_raw += debit;
      else if (bucket === 'imported') existing.imported += debit;
      else if (bucket === 'imported_gst') existing.imported_gst += debit;
      else if (bucket === 'gst') existing.gst += debit;
      else if (bucket === 'zero_rated') existing.zero_rated += debit;
      else if (bucket === 'exempt') existing.exempt += debit;
      else if (bucket === 'debit_credit_notes') existing.debit_credit_notes += debit;
      else existing.other += debit;
    }

    groups.set(key, existing);
  }

  return [...groups.values()];
});

function stripLeadingTinPrefix(tin: string): string {
  return tin.replace(/^00-/, '');
}

function isNonTaxableOnlyInvoice(row: InvoiceGroup) {
  return row.non_taxable !== 0 && !row.has_other_class;
}

function toSummaryRow(row: InvoiceGroup): SummaryRow {
  const factor = partialFactor.value;
  const untaxedPartial = row.partial_raw * factor;
  const taxedPartial = row.partial_raw - untaxedPartial;
  const gstBase = row.taxable + row.partial_raw;
  const taxedGstBase = row.taxable + taxedPartial;
  const payableGst = gstBase > 0 ? row.gst * (taxedGstBase / gstBase) : row.gst;
  const nonPayableGst = row.gst - payableGst;
  return {
    date: row.date,
    date_sort: row.date_sort,
    invoice_no: row.invoice_no,
    name: row.name,
    tin: row.tin,
    total_purchases: row.all_classes,
    imports: row.imported,
    standard_rated: row.taxable + taxedPartial,
    zero_rated: row.zero_rated,
    exempt: row.exempt + untaxedPartial + nonPayableGst + row.non_taxable + row.other,
    imported_gst: row.imported_gst,
    domestic_gst: payableGst,
    debit_credit_notes: row.debit_credit_notes,
    total_input_tax: payableGst + row.imported_gst - row.debit_credit_notes,
    partial_adjusted: row.partial_raw !== 0 && factor !== 1,
  };
}

function sortSummaryRows(rows: SummaryRow[]) {
  return [...rows].sort((a, b) => (
    a.date_sort - b.date_sort
    || a.invoice_no.localeCompare(b.invoice_no, undefined, { numeric: true })
    || a.name.localeCompare(b.name)
  ));
}

function matchesInvoiceFilter(row: SummaryRow, needle: string) {
  const dateLabel = formatSummaryDate(row.date).toLowerCase();
  return (
    dateLabel.includes(needle)
    || row.invoice_no.toLowerCase().includes(needle)
    || row.name.toLowerCase().includes(needle)
    || row.tin.toLowerCase().includes(needle)
  );
}

const summaryRows = computed(() => sortSummaryRows(
  groupedInvoices.value
    .filter((row) => !isNonTaxableOnlyInvoice(row))
    .map(toSummaryRow),
));

const nonTaxableRows = computed(() => sortSummaryRows(
  groupedInvoices.value
    .filter(isNonTaxableOnlyInvoice)
    .map(toSummaryRow),
));

const filteredSummaryRows = computed(() => {
  const needle = summaryFilter.value.trim().toLowerCase();
  if (!needle) return summaryRows.value;
  return summaryRows.value.filter((row) => matchesInvoiceFilter(row, needle));
});

const filteredNonTaxableRows = computed(() => {
  const needle = summaryFilter.value.trim().toLowerCase();
  if (!needle) return nonTaxableRows.value;
  return nonTaxableRows.value.filter((row) => matchesInvoiceFilter(row, needle));
});

const displayRows = computed<DisplayRow[]>(() => {
  if (viewMode.value === 'summary') return filteredSummaryRows.value;
  if (viewMode.value === 'non_taxable') return filteredNonTaxableRows.value;
  return detailRows.value;
});

const displayColumns = computed(() => {
  if (viewMode.value === 'summary') {
    return [
      { key: 'date', label: 'Date' },
      { key: 'invoice_no', label: 'Invoice No' },
      { key: 'name', label: 'Name' },
      { key: 'tin', label: 'Supplier TIN' },
      { key: 'total_purchases', label: 'Total Purchases (GST inclusive)' },
      { key: 'imports', label: 'Value of Imports (GST exclusive)' },
      { key: 'standard_rated', label: 'Value of standard rated purchases GST exclusive' },
      { key: 'zero_rated', label: 'Value for zero rated purchases' },
      { key: 'exempt', label: 'Value of exempt purchases' },
      { key: 'imported_gst', label: 'GST paid on imports at 12.5%' },
      { key: 'domestic_gst', label: 'GST Paid on domestic taxable purchases @ 12.5%' },
      { key: 'debit_credit_notes', label: 'Debit/Credit Notes' },
      { key: 'total_input_tax', label: 'Total input tax @12.5%' },
    ];
  }

  if (viewMode.value === 'non_taxable') {
    return [
      { key: 'date', label: 'Date' },
      { key: 'invoice_no', label: 'Invoice No' },
      { key: 'name', label: 'Name' },
      { key: 'tin', label: 'Supplier TIN' },
      { key: 'total_purchases', label: 'Total Purchases' },
    ];
  }

  const columns = props.sheet.columns.map((column) => ({
    key: column,
    label: headerLabel(column),
  }));
  return columns;
});

const summaryPurchasesTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.total_purchases, 0),
);
const summaryImportsTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.imports, 0),
);
const summaryStandardRatedTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.standard_rated, 0),
);
const summaryZeroRatedTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.zero_rated, 0),
);
const summaryExemptTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.exempt, 0),
);
const summaryImportedGstTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.imported_gst, 0),
);
const summaryDomesticGstTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.domestic_gst, 0),
);
const summaryDebitCreditNotesTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.debit_credit_notes, 0),
);
const summaryTotalInputTaxTotal = computed(() =>
  filteredSummaryRows.value.reduce((sum, row) => sum + row.total_input_tax, 0),
);
const nonTaxablePurchasesTotal = computed(() =>
  filteredNonTaxableRows.value.reduce((sum, row) => sum + row.total_purchases, 0),
);

function taxClassBucket(className: string): TaxClassBucket {
  const normalized = className.trim().toLowerCase().replace(/\s+/g, '').replace(/:+/g, ':');
  if (normalized === 'taxes:non-taxable' || normalized.endsWith(':non-taxable')) return 'non_taxable';
  if (
    normalized === 'taxes:partial'
    || normalized.endsWith(':partial')
    || normalized.endsWith('taxes-partial')
    || normalized.includes(':taxes-partial')
    || /(?:^|:)taxes?-?partial$/.test(normalized)
  ) {
    return 'partial';
  }
  if (normalized === 'taxes:taxable' || normalized.endsWith(':taxable')) return 'taxable';
  // Check imported-gst before Taxes:GST so "Taxes:Imported-gst" is not treated as domestic GST.
  if (
    normalized === 'taxes:imported-gst'
    || normalized === 'taxes:taxes:imported-gst'
    || normalized.endsWith(':imported-gst')
    || normalized.endsWith('imported-gst')
  ) {
    return 'imported_gst';
  }
  if (
    normalized === 'taxes:gst'
    || normalized.endsWith(':gst')
    || normalized.endsWith(':taxes:gst')
  ) {
    return 'gst';
  }
  if (normalized === 'taxes:imported' || normalized.endsWith(':imported')) return 'imported';
  if (
    normalized === 'taxes:zero-rated'
    || normalized === 'taxes:zerorated'
    || normalized.endsWith(':zero-rated')
    || normalized.endsWith(':zerorated')
  ) {
    return 'zero_rated';
  }
  if (
    normalized === 'taxes:exempted'
    || normalized === 'taxes:exempt'
    || normalized.endsWith(':exempted')
    || normalized.endsWith(':exempt')
  ) {
    return 'exempt';
  }
  if (
    normalized === 'taxes:debit-creditnotes'
    || normalized === 'taxes:debit-credit-notes'
    || normalized.endsWith(':debit-creditnotes')
    || normalized.endsWith(':debit-credit-notes')
    || normalized.includes('debit-creditnote')
  ) {
    return 'debit_credit_notes';
  }
  return 'other';
}

function isSummaryRow(row: DisplayRow): row is SummaryRow {
  return !('row' in row) && 'total_purchases' in row;
}

type NameOption = { label: string; value: string };

const availableNameOptions = computed((): NameOption[] => {
  const names = new Set<string>();
  for (const row of props.sheet.rows) {
    if (row.row === 1) continue;
    const name = String(row[nameColumn.value] ?? '').trim();
    if (!name) continue;
    if (excludedNameSet.value.has(name.toLowerCase())) continue;
    names.add(name);
  }
  return [...names].sort((a, b) => a.localeCompare(b)).map((name) => ({ label: name, value: name }));
});

const filteredNameOptions = ref<NameOption[]>([]);

watch(
  availableNameOptions,
  (options) => {
    filteredNameOptions.value = options;
  },
  { immediate: true },
);

function filterNameOptions(val: string, update: (callback: () => void) => void) {
  update(() => {
    const needle = val.trim().toLowerCase();
    filteredNameOptions.value = !needle
      ? availableNameOptions.value
      : availableNameOptions.value.filter((opt) => opt.label.toLowerCase().includes(needle));
  });
}

function cellValue(row: DisplayRow, column: string) {
  if (column === 'date') return 'date' in row ? row.date : '';
  if (column === 'invoice_no') return 'invoice_no' in row ? row.invoice_no : '';
  if (column === 'name') return 'name' in row ? row.name : '';
  if (column === 'tin') return 'tin' in row ? row.tin : '';
  if (column === 'total_purchases') return 'total_purchases' in row ? row.total_purchases : '';
  if (column === 'imports') return 'imports' in row ? row.imports : '';
  if (column === 'standard_rated') return 'standard_rated' in row ? row.standard_rated : '';
  if (column === 'zero_rated') return 'zero_rated' in row ? row.zero_rated : '';
  if (column === 'exempt') return 'exempt' in row ? row.exempt : '';
  if (column === 'imported_gst') return 'imported_gst' in row ? row.imported_gst : '';
  if (column === 'domestic_gst') return 'domestic_gst' in row ? row.domestic_gst : '';
  if (column === 'debit_credit_notes') return 'debit_credit_notes' in row ? row.debit_credit_notes : '';
  if (column === 'total_input_tax') return 'total_input_tax' in row ? row.total_input_tax : '';
  if (!('row' in row)) return '';
  const value = row[column];
  if (value === undefined || value === null || value === '') return '';
  return value;
}

function headerLabel(column: string) {
  if (!headerRow.value) return column;
  const label = cellValue(headerRow.value, column);
  return label ? String(label) : column;
}

function isHeaderRow(row: DisplayRow) {
  return 'row' in row && row.row === 1;
}

function isPeriodMarkerRow(row: TaxCalculatorGstSheetRow) {
  const marker = String(row.A ?? '').trim();
  if (!marker) return false;
  return String(row[dateColumn.value] ?? '').trim() === '';
}

function rowKey(row: DisplayRow, index: number) {
  if ('row' in row) return `detail-${row.row}`;
  return `summary-${row.date}-${row.invoice_no}-${row.name}-${index}`;
}

function rowClass(row: DisplayRow) {
  if (!('row' in row)) return '';
  if (isHeaderRow(row)) return 'purchase-ledger-row--header';
  if (isPeriodMarkerRow(row)) return 'purchase-ledger-row--section';
  return '';
}

function headerClass(column: string) {
  const classes = ['text-weight-bold'];
  if (
    column === 'debit'
    || column === 'total_purchases'
    || column === 'imports'
    || column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'imported_gst'
    || column === 'domestic_gst'
    || column === 'debit_credit_notes'
    || column === 'total_input_tax'
    || column === debitColumn.value
    || column === 'date'
    || column === dateColumn.value
    || column === 'invoice_no'
  ) {
    classes.push('text-right');
  } else {
    classes.push('text-left');
  }
  return classes;
}

function cellClass(column: string) {
  const classes = ['purchase-ledger-cell'];
  if (
    column === 'debit'
    || column === 'total_purchases'
    || column === 'imports'
    || column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'imported_gst'
    || column === 'domestic_gst'
    || column === 'debit_credit_notes'
    || column === 'total_input_tax'
    || column === debitColumn.value
    || column === 'date'
    || column === dateColumn.value
    || column === 'invoice_no'
  ) {
    classes.push('text-right');
  } else {
    classes.push('text-left');
  }
  if (column === nameColumn.value || column === 'name') classes.push('purchase-ledger-cell--name');
  if (column === classColumn.value) classes.push('purchase-ledger-cell--class');
  if (
    column === 'total_purchases'
    || column === 'domestic_gst'
    || column === 'total_input_tax'
  ) {
    classes.push('purchase-ledger-cell--calculated');
  }
  return classes;
}

function formatExcelDate(serial: number) {
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + serial * 86400000);
  return new Intl.DateTimeFormat('en-BZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: 'UTC',
  }).format(date);
}

function formatSummaryDate(value: string | number) {
  if (value === '') return '';
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 1000) return formatExcelDate(numeric);
  return String(value);
}

function money(value: number) {
  return new Intl.NumberFormat('en-BZ', { style: 'currency', currency: 'BZD' }).format(Number(value ?? 0));
}

function formatNumber(value: string | number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat('en-BZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatCell(column: string, row: DisplayRow) {
  const value = cellValue(row, column);
  if (value === '') return '';
  if ('row' in row && isHeaderRow(row)) return String(value);
  if (
    column === 'total_purchases'
    || column === 'imports'
    || column === 'standard_rated'
    || column === 'zero_rated'
    || column === 'exempt'
    || column === 'imported_gst'
    || column === 'domestic_gst'
    || column === 'debit_credit_notes'
    || column === 'total_input_tax'
    || column === 'debit'
  ) {
    return money(Number(value));
  }
  if (column === debitColumn.value) return formatNumber(value);
  if (column === 'date' || column === dateColumn.value) {
    return formatSummaryDate(value);
  }
  return String(value);
}

function isNegative(column: string, row: DisplayRow) {
  if (
    column !== 'debit'
    && column !== 'total_purchases'
    && column !== 'imports'
    && column !== 'standard_rated'
    && column !== 'zero_rated'
    && column !== 'exempt'
    && column !== 'imported_gst'
    && column !== 'domestic_gst'
    && column !== 'debit_credit_notes'
    && column !== 'total_input_tax'
    && column !== debitColumn.value
  ) {
    return false;
  }
  const value = cellValue(row, column);
  if (value === '') return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric < 0;
}

async function addExclusion(name: string | null) {
  if (!name) return;
  selectedExclusion.value = null;
  try {
    await store.addPurchaseLedgerExclusion(name);
    $q.notify({ type: 'positive', message: `${name} excluded from purchase ledger` });
  } catch {
    // store.error banner handles message
  }
}

async function removeExclusion(id: string) {
  try {
    await store.removePurchaseLedgerExclusion(id);
  } catch {
    // store.error banner handles message
  }
}

onMounted(() => {
  if (!organizationStore.organizations.length) {
    void organizationStore.fetchOrganizations();
  }
});

async function exportBts210a() {
  if (!summaryRows.value.length) {
    $q.notify({ type: 'negative', message: 'There are no BTS210a rows to export.' });
    return;
  }

  isExporting.value = true;
  try {
    if (!organizationStore.organizationToEdit && !organizationStore.organizations.length) {
      await organizationStore.fetchOrganizations();
    }
    const organization = organizationStore.organizationToEdit ?? organizationStore.organizations[0];
    await exportBts210aPurchaseLedger({
      rows: summaryRows.value,
      year: props.year,
      month: props.month,
      companyTin: organization?.taxIdentificationNumber?.trim() ?? '',
      companyName: (organization?.legalName || organization?.alias || '').trim(),
    });
    $q.notify({ type: 'positive', message: 'BTS210a purchase ledger exported.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to export BTS210a.',
    });
  } finally {
    isExporting.value = false;
  }
}
</script>

<style scoped>
.purchase-ledger-panel {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.purchase-ledger-toolbar {
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.purchase-ledger-view-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 0 0 auto;
}

.purchase-ledger-view-toggle :deep(.q-btn) {
  min-width: 0;
  padding-left: 10px;
  padding-right: 10px;
}

.purchase-ledger-view-toggle :deep(.q-btn-dropdown .q-btn) {
  min-width: 0;
}

.purchase-ledger-exclude {
  flex: 1 1 220px;
  min-width: 220px;
  max-width: 360px;
}

.purchase-ledger-filter {
  flex: 1 1 200px;
  min-width: 180px;
  max-width: 280px;
}

.purchase-ledger-toolbar :deep(.q-field--with-bottom) {
  padding-bottom: 0;
}

.purchase-ledger-table-wrap {
  position: relative;
  flex: 1 1 0;
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  background: #fff;
  padding-bottom: 48px;
  scroll-padding-bottom: 48px;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-table) {
  overflow: visible;
  width: max-content;
  min-width: 100%;
}

.purchase-ledger-table-wrap :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  line-height: 1.35;
  margin-bottom: 16px;
}

.purchase-ledger-table-wrap :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f5f5f5;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
}

.purchase-ledger-table-wrap--summary :deep(thead tr:first-child th) {
  top: 0;
  z-index: 3;
}

.purchase-ledger-table-wrap--summary :deep(thead tr:nth-child(2) th) {
  top: 29px;
  z-index: 2;
}

.purchase-ledger-table-wrap :deep(thead .purchase-ledger-line-header th) {
  background: #eeeeee;
}

.purchase-ledger-table-wrap :deep(tfoot td) {
  position: sticky;
  bottom: 0;
  background: #fff8e1;
  box-shadow: inset 0 1px 0 rgba(0, 0, 0, 0.12);
}

.purchase-ledger-table-wrap :deep(tbody tr:last-child td) {
  padding-bottom: 12px;
}

.purchase-ledger-table-wrap :deep(th),
.purchase-ledger-table-wrap :deep(td) {
  white-space: nowrap;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 4px 8px;
  vertical-align: middle;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-row-num) {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 42px;
  background: #fafafa;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.08);
}

.purchase-ledger-table-wrap :deep(thead .purchase-ledger-row-num) {
  z-index: 3;
  background: #f5f5f5;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-cell--name) {
  min-width: 220px;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-cell--class) {
  min-width: 140px;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-cell--calculated) {
  min-width: 130px;
}

.purchase-ledger-calculated--adjusted {
  background: #fff8e1;
  display: inline-block;
  padding: 1px 4px;
  border-radius: 3px;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-row--header) {
  background: #f5f5f5;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-row--section) {
  background: #fafafa;
  font-weight: 600;
}

.purchase-ledger-table-wrap :deep(.purchase-ledger-row--total) {
  background: #fff8e1;
  font-weight: 600;
}
</style>
