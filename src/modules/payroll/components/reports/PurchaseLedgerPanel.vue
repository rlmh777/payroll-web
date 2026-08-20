<template>
  <div class="purchase-ledger-panel">
    <div class="purchase-ledger-toolbar q-mb-md">
      <div class="purchase-ledger-view-toggle">
        <q-btn
          v-for="option in viewOptions"
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
      Upload the monthly purchase ledger workbook to view summary totals by company and class, or the full detail sheet.
    </q-banner>

    <div v-else class="purchase-ledger-table-wrap">
      <q-markup-table flat bordered dense class="purchase-ledger-table">
        <thead>
          <tr>
            <th v-if="viewMode === 'detail'" class="purchase-ledger-row-num text-right">#</th>
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
              <template v-if="column.key === 'calculated_debit'">
                <span
                  v-if="formatCalculatedDebit(row)"
                  :class="{
                    'text-negative': isNegativeCalculatedDebit(row),
                    'purchase-ledger-calculated--adjusted': isAdjustedCalculatedDebit(row),
                  }"
                >
                  {{ formatCalculatedDebit(row) }}
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
            <td class="text-right text-weight-bold">{{ money(summaryTotal) }}</td>
            <td class="text-right text-weight-bold">{{ money(summaryCalculatedTotal) }}</td>
          </tr>
        </tfoot>
      </q-markup-table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useTaxCalculatorStore,
  type TaxCalculatorGstSheetRow,
  type TaxCalculatorPurchaseLedgerExcludedName,
  type TaxCalculatorPurchaseLedgerSheet,
} from '@payroll/stores/tax-calculator-store';

type ViewMode = 'summary' | 'detail';
type SummaryRow = {
  name: string;
  class: string;
  debit: number;
  calculated_debit: number;
  adjusted: boolean;
};
type DisplayRow = TaxCalculatorGstSheetRow | SummaryRow;

const props = defineProps<{
  sheet: TaxCalculatorPurchaseLedgerSheet;
  excludedNames: TaxCalculatorPurchaseLedgerExcludedName[];
  taxableRatio?: number;
}>();

const store = useTaxCalculatorStore();
const $q = useQuasar();
const viewMode = ref<ViewMode>('summary');
const selectedExclusion = ref<string | null>(null);

const viewOptions = [
  { label: 'By Name & Class', value: 'summary' },
  { label: 'Raw Data', value: 'detail' },
];

const excludedNameSet = computed(() => new Set(
  props.excludedNames.map((item) => item.name.trim().toLowerCase()),
));

const hasData = computed(() => props.sheet.rows.length > 0);
const nameColumn = computed(() => props.sheet.name_column || 'F');
const classColumn = computed(() => props.sheet.class_column || 'L');
const debitColumn = computed(() => props.sheet.debit_column || 'N');
const dateColumn = computed(() => props.sheet.date_column || 'B');

const headerRow = computed(() => props.sheet.rows.find((row) => row.row === 1) ?? null);

const detailRows = computed(() => props.sheet.rows.filter((row) => {
  if (row.row === 1) return true;
  const name = String(row[nameColumn.value] ?? '').trim();
  if (!name) return true;
  return !excludedNameSet.value.has(name.toLowerCase());
}));

const summaryRows = computed(() => {
  const groups = new Map<string, SummaryRow>();
  const ratio = Number(props.taxableRatio ?? 0);
  const partialFactor = Math.max(0, 1 - ratio);

  for (const row of props.sheet.rows) {
    if (row.row === 1) continue;
    if (isPeriodMarkerRow(row)) continue;
    const name = String(row[nameColumn.value] ?? '').trim();
    if (!name || excludedNameSet.value.has(name.toLowerCase())) continue;
    const cls = String(row[classColumn.value] ?? '').trim();
    const debit = Number(row[debitColumn.value] ?? 0);
    if (!Number.isFinite(debit) || debit === 0) continue;
    const key = `${name}\u0000${cls}`;
    const existing = groups.get(key) ?? {
      name,
      class: cls,
      debit: 0,
      calculated_debit: 0,
      adjusted: false,
    };
    existing.debit += debit;
    groups.set(key, existing);
  }

  return [...groups.values()]
    .map((row) => {
      const adjusted = isPartialClass(row.class);
      const calculated = adjusted ? row.debit * partialFactor : row.debit;
      return {
        ...row,
        calculated_debit: calculated,
        adjusted,
      };
    })
    .sort((a, b) => (
      a.name.localeCompare(b.name) || a.class.localeCompare(b.class)
    ));
});

const displayRows = computed<DisplayRow[]>(() => (
  viewMode.value === 'summary' ? summaryRows.value : detailRows.value
));

const displayColumns = computed(() => {
  if (viewMode.value === 'summary') {
    return [
      { key: 'name', label: 'Name' },
      { key: 'class', label: 'Class' },
      { key: 'debit', label: 'Debit' },
      { key: 'calculated_debit', label: 'Calculated Debit' },
    ];
  }

  const columns = props.sheet.columns.map((column) => ({
    key: column,
    label: headerLabel(column),
  }));
  const calculatedCol = { key: 'calculated_debit', label: 'Calculated Debit' };
  const debitIndex = columns.findIndex((column) => column.key === debitColumn.value);
  if (debitIndex >= 0) {
    columns.splice(debitIndex + 1, 0, calculatedCol);
  } else {
    columns.push(calculatedCol);
  }
  return columns;
});

const summaryTotal = computed(() => summaryRows.value.reduce((sum, row) => sum + row.debit, 0));
const summaryCalculatedTotal = computed(() =>
  summaryRows.value.reduce((sum, row) => sum + row.calculated_debit, 0),
);

function isPartialClass(className: string) {
  const normalized = className.trim().toLowerCase().replace(/\s+/g, '');
  return normalized === 'taxes:partial' || normalized.endsWith(':partial');
}

function isSummaryRow(row: DisplayRow): row is SummaryRow {
  return !('row' in row) && 'calculated_debit' in row;
}

function calculatedDebitInfo(row: DisplayRow): { value: number | null; adjusted: boolean; headerLabel: boolean } {
  if (isSummaryRow(row)) {
    return { value: row.calculated_debit, adjusted: row.adjusted, headerLabel: false };
  }
  if (!('row' in row)) {
    return { value: null, adjusted: false, headerLabel: false };
  }
  if (isHeaderRow(row)) {
    return { value: null, adjusted: false, headerLabel: true };
  }
  if (isPeriodMarkerRow(row)) {
    return { value: null, adjusted: false, headerLabel: false };
  }

  const rawDebit = row[debitColumn.value];
  if (rawDebit === undefined || rawDebit === null || rawDebit === '') {
    return { value: null, adjusted: false, headerLabel: false };
  }

  const debit = Number(rawDebit);
  if (!Number.isFinite(debit)) {
    return { value: null, adjusted: false, headerLabel: false };
  }

  const cls = String(row[classColumn.value] ?? '').trim();
  const adjusted = isPartialClass(cls);
  const ratio = Number(props.taxableRatio ?? 0);
  const partialFactor = Math.max(0, 1 - ratio);
  return {
    value: adjusted ? debit * partialFactor : debit,
    adjusted,
    headerLabel: false,
  };
}

function formatCalculatedDebit(row: DisplayRow) {
  const info = calculatedDebitInfo(row);
  if (info.headerLabel) return 'Calculated Debit';
  if (info.value === null) return '';
  return money(info.value);
}

function isNegativeCalculatedDebit(row: DisplayRow) {
  const value = calculatedDebitInfo(row).value;
  return value !== null && value < 0;
}

function isAdjustedCalculatedDebit(row: DisplayRow) {
  return calculatedDebitInfo(row).adjusted;
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
  if (column === 'name') return 'name' in row ? row.name : '';
  if (column === 'class') return 'class' in row ? row.class : '';
  if (column === 'debit') return 'debit' in row ? row.debit : '';
  if (column === 'calculated_debit') return 'calculated_debit' in row ? row.calculated_debit : '';
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
  return `summary-${row.name}-${row.class}-${index}`;
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
    || column === 'calculated_debit'
    || column === debitColumn.value
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
    || column === 'calculated_debit'
    || column === debitColumn.value
    || column === dateColumn.value
  ) {
    classes.push('text-right');
  } else {
    classes.push('text-left');
  }
  if (column === nameColumn.value || column === 'name') classes.push('purchase-ledger-cell--name');
  if (column === classColumn.value || column === 'class') classes.push('purchase-ledger-cell--class');
  if (column === 'calculated_debit') classes.push('purchase-ledger-cell--calculated');
  return classes;
}

function formatExcelDate(serial: number) {
  const epoch = Date.UTC(1899, 11, 30);
  const date = new Date(epoch + serial * 86400000);
  return new Intl.DateTimeFormat('en-BZ', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
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
  if (column === 'debit' || column === 'calculated_debit') return money(Number(value));
  if (column === debitColumn.value) return formatNumber(value);
  if (column === dateColumn.value) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 1000) return formatExcelDate(numeric);
  }
  return String(value);
}

function isNegative(column: string, row: DisplayRow) {
  if (column !== 'debit' && column !== 'calculated_debit' && column !== debitColumn.value) return false;
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

.purchase-ledger-exclude {
  flex: 1 1 220px;
  min-width: 220px;
  max-width: 360px;
}

.purchase-ledger-toolbar :deep(.q-field--with-bottom) {
  padding-bottom: 0;
}

.purchase-ledger-table-wrap {
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
