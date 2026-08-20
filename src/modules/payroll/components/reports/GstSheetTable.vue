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
import type { TaxCalculatorGstSheetRow } from '@payroll/stores/tax-calculator-store';

const props = defineProps<{
  rows: TaxCalculatorGstSheetRow[];
}>();

const columns = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
] as const;

const numericColumns = new Set(['M', 'O', 'Q', 'T']);
const dateColumns = new Set(['E']);
const labelColumns = new Set(['A', 'B', 'C', 'D']);
const spacerColumns = new Set(['F', 'H', 'J', 'L', 'N', 'P', 'R', 'S']);

function cellValue(row: TaxCalculatorGstSheetRow, column: string) {
  const value = row[column];
  if (value === undefined || value === null || value === '') return '';
  return value;
}

function headerLabel(column: string) {
  if (props.rows.length === 0) return column;
  const header = props.rows.find((row) => row.row === 1);
  const label = header ? cellValue(header, column) : '';
  return label ? String(label) : column;
}

function isHeaderRow(row: TaxCalculatorGstSheetRow) {
  return row.row === 1;
}

function isTotalRow(row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row)) return false;
  for (const column of ['A', 'B', 'C', 'D']) {
    const value = String(cellValue(row, column)).trim();
    if (value && /^total\b/i.test(value)) return true;
  }
  return false;
}

function isSectionRow(row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row) || isTotalRow(row)) return false;
  const hasLabel = ['A', 'B', 'C', 'D'].some((column) => cellValue(row, column));
  const hasDetail = ['E', 'G', 'I', 'K', 'M', 'O'].some((column) => cellValue(row, column));
  return hasLabel && !hasDetail;
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
  if (spacerColumns.has(column)) classes.push('gst-sheet-cell--spacer');
  if (labelColumns.has(column)) classes.push('text-left');
  if (numericColumns.has(column) || dateColumns.has(column)) classes.push('text-right');
  if (isHeader) classes.push('text-weight-bold');
  if (!isHeader && row && labelColumns.has(column) && cellValue(row, column)) {
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
  if (dateColumns.has(column)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric) && numeric > 1000) return formatExcelDate(numeric);
  }
  if (numericColumns.has(column)) return formatNumber(value);
  return String(value);
}

function isNegative(column: string, row: TaxCalculatorGstSheetRow) {
  if (isHeaderRow(row) || !numericColumns.has(column)) return false;
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

.gst-sheet-wrap :deep(td:nth-child(3)),
.gst-sheet-wrap :deep(th:nth-child(3)) { min-width: 72px; }
.gst-sheet-wrap :deep(td:nth-child(4)),
.gst-sheet-wrap :deep(th:nth-child(4)) { min-width: 180px; }
.gst-sheet-wrap :deep(td:nth-child(5)),
.gst-sheet-wrap :deep(th:nth-child(5)) { min-width: 220px; }
.gst-sheet-wrap :deep(td:nth-child(6)),
.gst-sheet-wrap :deep(th:nth-child(6)) { min-width: 88px; }
.gst-sheet-wrap :deep(td:nth-child(8)),
.gst-sheet-wrap :deep(th:nth-child(8)) { min-width: 120px; }
.gst-sheet-wrap :deep(td:nth-child(10)),
.gst-sheet-wrap :deep(th:nth-child(10)) { min-width: 160px; }
.gst-sheet-wrap :deep(td:nth-child(12)),
.gst-sheet-wrap :deep(th:nth-child(12)) { min-width: 180px; }
.gst-sheet-wrap :deep(td:nth-child(14)),
.gst-sheet-wrap :deep(th:nth-child(14)),
.gst-sheet-wrap :deep(td:nth-child(16)),
.gst-sheet-wrap :deep(th:nth-child(16)),
.gst-sheet-wrap :deep(td:nth-child(18)),
.gst-sheet-wrap :deep(th:nth-child(18)),
.gst-sheet-wrap :deep(td:nth-child(21)),
.gst-sheet-wrap :deep(th:nth-child(21)) {
  min-width: 96px;
}

.gst-sheet-wrap :deep(.gst-sheet-cell--spacer) {
  min-width: 8px;
  max-width: 8px;
  padding-left: 0;
  padding-right: 0;
}

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
