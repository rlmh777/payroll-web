<template>
  <div class="gst-sheet-wrap">
    <q-markup-table flat bordered dense class="gst-sheet-table">
      <thead>
        <tr>
          <th class="gst-sheet-row-num text-right">#</th>
          <th
            v-for="column in columns"
            :key="column"
            :class="columnClass(column, true)"
          >
            {{ headerLabel(column) }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="sheetRow in rows"
          :key="sheetRow.row"
          :class="rowClass(sheetRow)"
        >
          <td class="gst-sheet-row-num text-right text-grey-7">{{ sheetRow.row }}</td>
          <td
            v-for="column in columns"
            :key="column"
            :class="columnClass(column, false, sheetRow)"
          >
            <span :class="{ 'text-negative': isNegative(column, sheetRow) }">
              {{ formatCell(column, sheetRow) }}
            </span>
          </td>
        </tr>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TaxCalculatorGstSheetRow } from '@payroll/stores/tax-calculator-store';

const props = defineProps<{
  rows: TaxCalculatorGstSheetRow[];
}>();

const COLUMN_RE = /^[A-Z]+$/;
const MONEY_HEADERS = new Set(['debit', 'credit', 'balance', 'amount']);
const FALLBACK_DATE_COLUMNS = new Set(['E']);
const FALLBACK_MONEY_COLUMNS = new Set(['M', 'O', 'Q', 'T']);

function columnIndex(column: string): number {
  let index = 0;
  for (let i = 0; i < column.length; i += 1) {
    index = index * 26 + (column.charCodeAt(i) - 64);
  }
  return index;
}

function cellValue(row: TaxCalculatorGstSheetRow, column: string) {
  const value = row[column];
  if (value === undefined || value === null || value === '') return '';
  return value;
}

const headerRow = computed(() => props.rows.find((row) => row.row === 1) ?? null);

const columns = computed(() => {
  const used = new Set<string>();
  for (const row of props.rows) {
    for (const key of Object.keys(row)) {
      if (!COLUMN_RE.test(key)) continue;
      if (cellValue(row, key) === '') continue;
      used.add(key);
    }
  }
  return [...used].sort((a, b) => columnIndex(a) - columnIndex(b));
});

function headerName(column: string): string {
  const header = headerRow.value;
  if (!header) return '';
  return String(cellValue(header, column)).trim().toLowerCase();
}

const dateColumns = computed(() => {
  const fromHeader = columns.value.filter((column) => headerName(column) === 'date');
  if (fromHeader.length > 0) return new Set(fromHeader);
  return new Set(columns.value.filter((column) => FALLBACK_DATE_COLUMNS.has(column)));
});

const moneyColumns = computed(() => {
  const fromHeader = columns.value.filter((column) => MONEY_HEADERS.has(headerName(column)));
  if (fromHeader.length > 0) return new Set(fromHeader);
  return new Set(columns.value.filter((column) => FALLBACK_MONEY_COLUMNS.has(column)));
});

function headerLabel(column: string) {
  const header = headerRow.value;
  const label = header ? cellValue(header, column) : '';
  return label ? String(label) : column;
}

function isHeaderRow(row: TaxCalculatorGstSheetRow) {
  return row.row === 1;
}

function isTotalRow(row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row)) return false;
  return columns.value.some((column) => {
    const value = String(cellValue(row, column)).trim();
    return value !== '' && /^total\b/i.test(value);
  });
}

function isSectionRow(row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row) || isTotalRow(row)) return false;
  const hasTransaction = columns.value.some((column) => {
    const name = headerName(column);
    if (!['type', 'date', 'num', 'name', 'memo'].includes(name)) return false;
    return cellValue(row, column) !== '';
  });
  const hasLabel = columns.value.some((column) => {
    const name = headerName(column);
    if (['type', 'date', 'num', 'name', 'memo', 'debit', 'credit', 'balance', 'amount'].includes(name)) {
      return false;
    }
    return cellValue(row, column) !== '';
  });
  return hasLabel && !hasTransaction;
}

function rowClass(row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row)) return 'gst-sheet-row--header';
  if (String(cellValue(row, 'A')).trim().toUpperCase() === 'TOTAL') return 'gst-sheet-row--grand-total';
  if (isTotalRow(row)) return 'gst-sheet-row--total';
  if (isSectionRow(row)) return 'gst-sheet-row--section';
  return '';
}

function columnClass(column: string, isHeader: boolean, row?: TaxCalculatorGstSheetRow) {
  const classes = ['gst-sheet-cell'];
  const name = headerName(column);
  if (name === 'date' || dateColumns.value.has(column)) classes.push('gst-sheet-cell--date', 'text-right');
  else if (MONEY_HEADERS.has(name) || moneyColumns.value.has(column)) classes.push('gst-sheet-cell--money', 'text-right');
  else if (name === 'name') classes.push('gst-sheet-cell--name', 'text-left');
  else if (name === 'memo') classes.push('gst-sheet-cell--memo', 'text-left');
  else if (name === 'type' || name === 'num') classes.push('gst-sheet-cell--type', 'text-left');
  else classes.push('gst-sheet-cell--label', 'text-left');
  if (isHeader) classes.push('text-weight-bold');
  if (!isHeader && row && ['A', 'B', 'C'].includes(column) && cellValue(row, column)) {
    if (column === 'B') classes.push('text-weight-bold');
    if (column === 'C') classes.push('text-weight-medium');
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

function formatNumber(value: string | number) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat('en-BZ', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

function formatCell(column: string, row: TaxCalculatorGstSheetRow) {
  const value = cellValue(row, column);
  if (value === '') return '';
  if (isHeaderRow(row)) return String(value);
  if (dateColumns.value.has(column)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 1000) return formatExcelDate(numeric);
  }
  if (moneyColumns.value.has(column)) return formatNumber(value);
  return String(value);
}

function isNegative(column: string, row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row) || !moneyColumns.value.has(column)) return false;
  const value = cellValue(row, column);
  if (value === '') return false;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric < 0;
}
</script>

<style scoped>
.gst-sheet-wrap {
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

.gst-sheet-wrap :deep(.gst-sheet-table) {
  overflow: visible;
  width: max-content;
  min-width: 100%;
}

.gst-sheet-wrap :deep(table) {
  border-collapse: separate;
  border-spacing: 0;
  font-size: 12px;
  line-height: 1.35;
  margin-bottom: 16px;
}

.gst-sheet-wrap :deep(thead th) {
  position: sticky;
  top: 0;
  z-index: 2;
  background: #f5f5f5;
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.12);
}

.gst-sheet-wrap :deep(tbody tr:last-child td) {
  padding-bottom: 12px;
}

.gst-sheet-wrap :deep(th),
.gst-sheet-wrap :deep(td) {
  white-space: nowrap;
  border-right: 1px solid rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding: 4px 8px;
  vertical-align: middle;
}

.gst-sheet-wrap :deep(.gst-sheet-row-num) {
  position: sticky;
  left: 0;
  z-index: 1;
  min-width: 42px;
  background: #fafafa;
  box-shadow: inset -1px 0 0 rgba(0, 0, 0, 0.08);
}

.gst-sheet-wrap :deep(thead .gst-sheet-row-num) {
  z-index: 3;
  background: #f5f5f5;
}

.gst-sheet-wrap :deep(.gst-sheet-cell--label) { min-width: 140px; }
.gst-sheet-wrap :deep(.gst-sheet-cell--type) { min-width: 88px; }
.gst-sheet-wrap :deep(.gst-sheet-cell--date) { min-width: 88px; }
.gst-sheet-wrap :deep(.gst-sheet-cell--name) { min-width: 180px; }
.gst-sheet-wrap :deep(.gst-sheet-cell--memo) { min-width: 160px; }
.gst-sheet-wrap :deep(.gst-sheet-cell--money) { min-width: 96px; }

.gst-sheet-wrap :deep(.gst-sheet-row--header) {
  background: #f5f5f5;
}

.gst-sheet-wrap :deep(.gst-sheet-row--section) {
  background: #fafafa;
}

.gst-sheet-wrap :deep(.gst-sheet-row--total),
.gst-sheet-wrap :deep(.gst-sheet-row--grand-total) {
  background: #fff8e1;
  font-weight: 600;
}

.gst-sheet-wrap :deep(.gst-sheet-row--grand-total) {
  background: #fff3cd;
}
</style>
