<template>
  <q-card flat bordered class="payroll-run-card q-mb-md">
    <q-card-section>
      <div class="row items-start q-col-gutter-lg">
        <div class="col-12 col-lg-4">
          <div class="text-overline text-primary">Pool distribution</div>
          <div class="text-h6 text-weight-bold">Enter pool totals</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Upload one file at a time for shares or tips. Each file has its own total and is split only across the employees in that file. Replace removes the employees already loaded for that pool. Add keeps them and loads the next department or list beside them. Each pool posts to the account on its earning code.
          </div>
          <div class="q-mt-md column q-gutter-sm pool-actions">
            <q-btn
              unelevated
              color="primary"
              icon="save"
              label="Save totals"
              align="left"
              :loading="saving"
              :disable="disabled || !payrollRunId"
              @click="saveTotals"
            />
            <q-btn
              outline
              color="primary"
              icon="pie_chart"
              label="Distribute"
              align="left"
              :loading="distributing"
              :disable="disabled || !payrollRunId"
              @click="distribute"
            />
            <q-btn
              flat
              color="primary"
              icon="download"
              label="Download sample file"
              align="left"
              @click="downloadShareSample"
            />
          </div>
        </div>

        <div class="col-12 col-lg-8">
          <q-banner v-if="!payrollRunId" rounded class="bg-amber-1 text-amber-10 q-mb-md">
            <template #avatar><q-icon name="info" /></template>
            Select a pay period, then continue to this step so a payroll run is created. Each active pool type will show an amount field.
          </q-banner>
          <q-banner v-else-if="loadError" rounded class="bg-red-1 text-red-9 q-mb-md">
            <template #avatar><q-icon name="error_outline" /></template>
            {{ loadError }}
          </q-banner>

          <div class="pool-entries">
            <div v-for="row in totals" :key="row.poolDistributionTypeId" class="pool-entry">
              <div class="pool-entry__details">
                <div class="text-subtitle1 text-weight-medium">{{ row.name }}</div>
                <div class="text-caption text-grey-7">
                  {{ row.code }} · {{ modeLabel(row.calculationMode) }}
                  <span v-if="row.requiresHoursEligibility && !row.importedShareCount"> · hours eligibility</span>
                </div>
                <div
                  v-if="row.calculationMode === 'department_equal_share' && !row.importedShareCount"
                  class="text-caption text-grey-7"
                >
                  {{ departmentShareCaption(row) }}
                </div>
                <div class="text-caption text-grey-7">{{ uploadCaption(row) }}</div>
                <div class="text-caption text-grey-7">{{ shareCaption(row) }} {{ accountCaption(row) }}</div>
                <div v-if="shareErrors[row.poolDistributionTypeId]" class="text-caption text-negative">
                  {{ shareErrors[row.poolDistributionTypeId] }}
                </div>
              </div>
              <div class="pool-entry__controls">
                <q-input
                  class="pool-entry__field"
                  :model-value="amountInputValue(row)"
                  type="text"
                  inputmode="decimal"
                  dense
                  outlined
                  hide-bottom-space
                  prefix="$"
                  :label="usesNextFileTotal(row) ? 'Total for this file' : 'Total payout'"
                  :disable="disabled || row.calculationMode === 'disabled'"
                  @focus="startEditingAmount(row)"
                  @blur="stopEditingAmount"
                  @update:model-value="(value) => onAmountInput(row, value)"
                />
                <q-file
                  class="pool-entry__field"
                  dense
                  outlined
                  hide-bottom-space
                  :label="isTipsPool(row) ? 'Upload tip percentages' : 'Upload shares'"
                  accept=".csv,.xls,.xlsx,text/csv"
                  :disable="disabled || !payrollRunId"
                  :loading="uploadingShareId === row.poolDistributionTypeId"
                  :model-value="shareFiles[row.poolDistributionTypeId] ?? null"
                  @update:model-value="(file) => uploadShares(row, file)"
                >
                  <template #prepend>
                    <q-icon name="upload_file" />
                  </template>
                </q-file>
                <q-option-group
                  v-model="uploadMode[row.poolDistributionTypeId]"
                  class="pool-entry__modes"
                  dense
                  :options="uploadModeOptions"
                  :disable="disabled || !payrollRunId"
                />
              </div>
            </div>
            <div v-if="payrollRunId && !totals.length && !isLoadingTotals" class="pool-entry text-grey-7">
              No active pool types. Configure them under Settings → General → Pool Distribution.
            </div>
          </div>

          <q-table
            v-if="departmentBreakdown.length"
            class="q-mt-md"
            title="Department split"
            :rows="departmentBreakdown"
            :columns="departmentColumns"
            row-key="rowKey"
            flat
            bordered
            dense
            hide-pagination
            :pagination="{ rowsPerPage: 0 }"
          />

        </div>
      </div>

      <div v-if="payrollRunId" class="q-mt-lg">
        <div class="text-h6 text-weight-bold">Distribution by employee</div>
        <div class="text-body2 text-grey-7 q-mt-xs q-mb-md">
          After Distribute, each employee is listed here so the uploaded shares, tip percentages, and amounts can be checked. Change a value and save that employee. The correction is what this payroll pays.
        </div>
        <q-banner v-if="!distributions.length" rounded class="bg-grey-2 text-grey-8">
          Run Distribute to list every employee in the pools above.
        </q-banner>
        <q-table
          v-for="pool in distributedPools"
          :key="pool.poolDistributionTypeId"
          class="q-mt-md pool-distribution-table"
          :title="pool.name"
          :rows="distributionsFor(pool)"
          :columns="employeeColumns(pool)"
          row-key="id"
          flat
          bordered
          dense
          :rows-per-page-options="[10, 25, 50, 0]"
        >
          <template #body-cell-paidShares="cell">
            <q-td :props="cell">
              <q-input
                v-model="draftFor(cell.row).paidShares"
                class="pool-distribution-field"
                dense
                outlined
                hide-bottom-space
                inputmode="decimal"
                :disable="disabled"
              />
            </q-td>
          </template>
          <template #body-cell-paidPercent="cell">
            <q-td :props="cell">
              <q-input
                v-model="draftFor(cell.row).paidPercent"
                class="pool-distribution-field"
                dense
                outlined
                hide-bottom-space
                inputmode="decimal"
                suffix="%"
                :disable="disabled"
              />
            </q-td>
          </template>
          <template #body-cell-amount="cell">
            <q-td :props="cell">
              <q-input
                v-model="draftFor(cell.row).amount"
                class="pool-distribution-field"
                dense
                outlined
                hide-bottom-space
                inputmode="decimal"
                prefix="$"
                :disable="disabled"
              />
            </q-td>
          </template>
          <template #body-cell-actions="cell">
            <q-td :props="cell">
              <q-btn
                dense
                unelevated
                color="primary"
                label="Save"
                :disable="disabled || !isDistributionDirty(cell.row)"
                :loading="savingDistributionId === cell.row.id"
                @click="saveDistribution(cell.row)"
              />
            </q-td>
          </template>
          <template #bottom-row>
            <q-tr>
              <q-td colspan="2" class="text-weight-medium">Total</q-td>
              <q-td />
              <q-td class="text-right text-weight-medium">{{ formatMoney(poolDistributionTotal(pool)) }}</q-td>
              <q-td />
              <q-td />
            </q-tr>
          </template>
        </q-table>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import * as XLSX from 'xlsx';
import { useAuthStore } from '@core/stores/auth';
import {
  POOL_CALCULATION_MODE_OPTIONS,
  usePoolDistributionTypeStore,
  type PoolDistributionType,
} from '@payroll/stores/pool-distribution-type-store';

const props = defineProps<{
  payrollRunId: string | null;
  disabled?: boolean;
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const poolTypeStore = usePoolDistributionTypeStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

type DepartmentShare = {
  departmentId: number;
  departmentName?: string | null;
  percent: number;
};

type PoolTotalRow = {
  poolDistributionTypeId: number;
  code: string;
  name: string;
  calculationMode: string;
  requiresHoursEligibility: boolean;
  earningCodeName?: string | null;
  accountName?: string | null;
  accountCode?: string | null;
  importedShareCount: number;
  importedShareTotal: number;
  importedFileCount: number;
  totalAmount: number;
  notes?: string | null;
  departmentShares?: DepartmentShare[];
};

type DepartmentBreakdownRow = {
  rowKey: string;
  poolDistributionTypeId?: number | undefined;
  poolName?: string | undefined;
  departmentId: number;
  departmentName?: string | null | undefined;
  percent: number;
  departmentAmount: number;
  workingCount: number;
  listedCount: number;
};

type DistributionRow = {
  id: string;
  employeeId: string;
  employeeName?: string | null;
  employeeCode?: string | null;
  poolDistributionTypeId: number;
  poolName?: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentPercent?: number | null;
  departmentAmount?: number | null;
  workedThisPeriod?: boolean | null;
  points: number;
  weight: number;
  weightedPoints: number;
  paidShares?: number | null;
  paidPercent?: number | null;
  amount: number;
  isEligible: boolean;
  eligibilityReason?: string | null;
  manuallyCorrected?: boolean;
};

const totals = ref<PoolTotalRow[]>([]);
const distributions = ref<DistributionRow[]>([]);
const departmentBreakdown = ref<DepartmentBreakdownRow[]>([]);
const saving = ref(false);
const distributing = ref(false);
const uploadingShareId = ref<number | null>(null);
const shareFiles = reactive<Record<number, File | null>>({});
const shareErrors = reactive<Record<number, string>>({});
const uploadMode = reactive<Record<number, 'replace' | 'amend'>>({});
const nextFileTotals = reactive<Record<number, number>>({});
const uploadModeOptions = [
  { label: 'Replace loaded employees', value: 'replace' },
  { label: 'Add to loaded employees', value: 'amend' },
];
const isLoadingTotals = ref(false);
const loadError = ref<string | null>(null);

const editingAmountId = ref<number | null>(null);
const editingAmountDraft = ref('');

function formatMoney(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

const departmentColumns: QTableProps['columns'] = [
  { name: 'poolName', label: 'Pool', field: (row) => row.poolName || '—', align: 'left' },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' },
  { name: 'percent', label: '%', field: (row) => `${Number(row.percent).toFixed(2)}%`, align: 'right' },
  { name: 'departmentAmount', label: 'Amount', field: (row) => formatMoney(row.departmentAmount), align: 'right' },
  { name: 'workingCount', label: 'Working', field: 'workingCount', align: 'right' },
  { name: 'listedCount', label: 'Listed', field: 'listedCount', align: 'right' },
];

const savingDistributionId = ref<string | null>(null);
const distributionDrafts = reactive<Record<string, { paidShares: string; paidPercent: string; amount: string }>>({});

function employeeColumns(pool: PoolTotalRow): NonNullable<QTableProps['columns']> {
  const unitColumn = isTipsPool(pool)
    ? { name: 'paidPercent', label: 'Tip %', field: 'paidPercent', align: 'right' as const }
    : { name: 'paidShares', label: 'Shares', field: 'paidShares', align: 'right' as const };
  return [
    { name: 'employeeCode', label: 'Employee code', field: (row) => row.employeeCode || '—', align: 'left' },
    { name: 'employeeName', label: 'Employee', field: (row) => row.employeeName || row.employeeId, align: 'left' },
    unitColumn,
    { name: 'amount', label: 'Amount', field: (row) => formatMoney(row.amount), align: 'right' },
    {
      name: 'eligible',
      label: 'Status',
      field: (row) => (row.isEligible ? 'Paid' : row.eligibilityReason || 'Not paid'),
      align: 'left',
    },
    { name: 'actions', label: '', field: 'id', align: 'right' },
  ];
}

function distributionsFor(pool: PoolTotalRow): DistributionRow[] {
  return distributions.value
    .filter((row) => row.poolDistributionTypeId === pool.poolDistributionTypeId)
    .slice()
    .sort((left, right) => (left.employeeCode || left.employeeName || '').localeCompare(right.employeeCode || right.employeeName || ''));
}

function poolDistributionTotal(pool: PoolTotalRow): number {
  return distributionsFor(pool).reduce((sum, row) => sum + Number(row.amount || 0), 0);
}

const distributedPools = computed(() => totals.value.filter((pool) => distributionsFor(pool).length > 0));

function mapDistribution(row: Record<string, unknown>): DistributionRow {
  const paidShares = row.paidShares ?? row.paid_shares;
  const paidPercent = row.paidPercent ?? row.paid_percent;
  return {
    id: asText(row.id),
    employeeId: asText(row.employeeId ?? row.employee_id),
    employeeName: asNullableText(row.employeeName ?? row.employee_name),
    employeeCode: asNullableText(row.employeeCode ?? row.employee_code),
    poolDistributionTypeId: Number(row.poolDistributionTypeId ?? row.pool_distribution_type_id ?? 0),
    poolName: asNullableText(row.poolName ?? row.pool_name),
    departmentId: row.departmentId == null && row.department_id == null ? null : Number(row.departmentId ?? row.department_id),
    departmentName: asNullableText(row.departmentName ?? row.department_name),
    departmentPercent: row.departmentPercent == null && row.department_percent == null ? null : Number(row.departmentPercent ?? row.department_percent),
    departmentAmount: row.departmentAmount == null && row.department_amount == null ? null : Number(row.departmentAmount ?? row.department_amount),
    workedThisPeriod: Boolean(row.workedThisPeriod ?? row.worked_this_period),
    points: Number(row.points ?? 0),
    weight: Number(row.weight ?? 0),
    weightedPoints: Number(row.weightedPoints ?? row.weighted_points ?? 0),
    paidShares: paidShares == null || paidShares === '' ? null : Number(paidShares),
    paidPercent: paidPercent == null || paidPercent === '' ? null : Number(paidPercent),
    amount: Number(row.amount ?? 0),
    isEligible: Boolean(row.isEligible ?? row.is_eligible),
    eligibilityReason: asNullableText(row.eligibilityReason ?? row.eligibility_reason),
    manuallyCorrected: Boolean(row.manuallyCorrected ?? row.manually_corrected),
  };
}

function replaceDistributions(rows: DistributionRow[]) {
  distributions.value = rows;
  const ids = new Set(rows.map((row) => row.id));
  for (const id of Object.keys(distributionDrafts)) {
    if (!ids.has(id)) delete distributionDrafts[id];
  }
  for (const row of rows) {
    distributionDrafts[row.id] = {
      paidShares: row.paidShares == null ? '' : String(row.paidShares),
      paidPercent: row.paidPercent == null ? '' : String(row.paidPercent),
      amount: formatMoney(row.amount),
    };
  }
}

function draftFor(row: DistributionRow): { paidShares: string; paidPercent: string; amount: string } {
  const existing = distributionDrafts[row.id];
  if (existing) return existing;
  const created = {
    paidShares: row.paidShares == null ? '' : String(row.paidShares),
    paidPercent: row.paidPercent == null ? '' : String(row.paidPercent),
    amount: formatMoney(row.amount),
  };
  distributionDrafts[row.id] = created;
  return created;
}

function parseDraftNumber(value: string): number | null {
  const trimmed = value.replace(/[$,%\s,]/g, '');
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function sameDraftNumber(left: number | null, right: number | null): boolean {
  if (left == null && right == null) return true;
  if (left == null || right == null) return false;
  return Math.abs(left - right) < 0.0001;
}

function isDistributionDirty(row: DistributionRow): boolean {
  const draft = draftFor(row);
  return !sameDraftNumber(parseDraftNumber(draft.amount), Number(row.amount))
    || !sameDraftNumber(parseDraftNumber(draft.paidShares), row.paidShares == null ? null : Number(row.paidShares))
    || !sameDraftNumber(parseDraftNumber(draft.paidPercent), row.paidPercent == null ? null : Number(row.paidPercent));
}

function modeLabel(mode: string) {
  return POOL_CALCULATION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

function usesNextFileTotal(row: PoolTotalRow): boolean {
  return row.importedFileCount > 0;
}

function amountInputValue(row: PoolTotalRow): string {
  if (editingAmountId.value === row.poolDistributionTypeId) {
    return editingAmountDraft.value;
  }
  if (usesNextFileTotal(row)) {
    const amount = nextFileTotals[row.poolDistributionTypeId] ?? 0;
    return amount ? formatMoney(amount) : '';
  }
  return formatMoney(row.totalAmount);
}

function startEditingAmount(row: PoolTotalRow) {
  editingAmountId.value = row.poolDistributionTypeId;
  const current = usesNextFileTotal(row)
    ? nextFileTotals[row.poolDistributionTypeId] ?? 0
    : row.totalAmount;
  editingAmountDraft.value = current ? String(current) : '';
}

function stopEditingAmount() {
  editingAmountId.value = null;
  editingAmountDraft.value = '';
}

function onAmountInput(row: PoolTotalRow, value: string | number | null) {
  const raw = String(value ?? '');
  editingAmountDraft.value = raw;
  const trimmed = raw.replace(/,/g, '').trim();
  if (trimmed === '' || trimmed === '.') {
    if (usesNextFileTotal(row)) {
      nextFileTotals[row.poolDistributionTypeId] = 0;
    } else {
      row.totalAmount = 0;
    }
    return;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) return;
  if (usesNextFileTotal(row)) {
    nextFileTotals[row.poolDistributionTypeId] = parsed;
    return;
  }
  row.totalAmount = parsed;
}

function departmentShareCaption(row: PoolTotalRow) {
  const shares = row.departmentShares ?? [];
  if (!shares.length) return 'Configure department percentages in Settings → General → Pool Distribution. They must add to 100%.';
  return shares
    .map((share) => `${share.departmentName || share.departmentId} ${Number(share.percent).toFixed(2)}%`)
    .join(' · ');
}

function headers(): HeadersInit {
  const result: HeadersInit = { 'Content-Type': 'application/json' };
  if (authStore.token) result.Authorization = `Bearer ${authStore.token}`;
  return result;
}

function rebuildDepartmentBreakdown(rows: DistributionRow[]) {
  const grouped = new Map<string, DepartmentBreakdownRow>();
  for (const row of rows) {
    if (row.departmentId == null || row.departmentPercent == null) continue;
    const rowKey = `${row.poolDistributionTypeId}:${row.departmentId}`;
    const existing = grouped.get(rowKey) ?? {
      rowKey,
      poolDistributionTypeId: row.poolDistributionTypeId,
      poolName: row.poolName ?? undefined,
      departmentId: row.departmentId,
      departmentName: row.departmentName,
      percent: Number(row.departmentPercent ?? 0),
      departmentAmount: Number(row.departmentAmount ?? 0),
      workingCount: 0,
      listedCount: 0,
    };
    existing.listedCount += 1;
    if (row.workedThisPeriod && row.isEligible) existing.workingCount += 1;
    grouped.set(rowKey, existing);
  }
  departmentBreakdown.value = [...grouped.values()];
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return fallback;
}

function asNullableText(value: unknown): string | null {
  if (value == null) return null;
  const text = asText(value);
  return text === '' ? null : text;
}

function mapDepartmentShares(row: Record<string, unknown>): DepartmentShare[] {
  const shares = (row.departmentShares ?? row.department_shares ?? []) as Array<Record<string, unknown>>;
  return shares.map((share) => ({
    departmentId: Number(share.departmentId ?? share.department_id ?? 0),
    departmentName: asNullableText(share.departmentName ?? share.department_name),
    percent: Number(share.percent ?? 0),
  }));
}

function mapPoolTotalRow(row: Record<string, unknown>): PoolTotalRow {
  return {
    poolDistributionTypeId: Number(row.poolDistributionTypeId ?? row.pool_distribution_type_id ?? row.id ?? 0),
    code: asText(row.code),
    name: asText(row.name),
    calculationMode: asText(row.calculationMode ?? row.calculation_mode),
    requiresHoursEligibility: Boolean(row.requiresHoursEligibility ?? row.requires_hours_eligibility),
    earningCodeName: asNullableText(row.earningCodeName ?? row.earning_code_name),
    accountName: asNullableText(row.accountName ?? row.account_name),
    accountCode: asNullableText(row.accountCode ?? row.account_code),
    importedShareCount: Number(row.importedShareCount ?? row.imported_share_count ?? 0),
    importedShareTotal: Number(row.importedShareTotal ?? row.imported_share_total ?? 0),
    importedFileCount: Number(row.importedFileCount ?? row.imported_file_count ?? 0),
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    notes: asNullableText(row.notes),
    departmentShares: mapDepartmentShares(row),
  };
}

function isTipsPool(row: PoolTotalRow): boolean {
  return row.code.toUpperCase() === 'TIPS' || row.name.toLowerCase().includes('tip');
}

function uploadCaption(row: PoolTotalRow): string {
  const weight = isTipsPool(row) ? 'tip percentage' : 'number of shares';
  return `Columns: employee code or internal code, employee name, ${weight}, and an optional amount. The code matches the employee. Replace removes everyone already loaded for this pool. Add keeps them and splits this file’s total only across the employees in the new file.`;
}

function shareCaption(row: PoolTotalRow): string {
  if (!row.importedShareCount) {
    return 'No distribution file uploaded.';
  }
  const unit = isTipsPool(row) ? '%' : 'shares';
  const files = row.importedFileCount > 1 ? ` in ${row.importedFileCount} files` : '';
  return `${row.importedShareCount} employees${files}, ${row.importedShareTotal} ${unit}. Combined total ${formatMoney(row.totalAmount)}.`;
}

function accountCaption(row: PoolTotalRow): string {
  if (row.accountCode || row.accountName) {
    return `Posts to ${[row.accountCode, row.accountName].filter(Boolean).join(' ')}.`;
  }
  if (row.earningCodeName) {
    return `Posts through ${row.earningCodeName}.`;
  }
  return 'Set an earning account on this pool so the amount hits the right GL.';
}

function downloadShareSample() {
  const columnWidths = [{ wch: 16 }, { wch: 22 }, { wch: 12 }, { wch: 12 }];
  const shares = XLSX.utils.aoa_to_sheet([
    ['Employee code', 'Employee name', 'Shares', 'Amount'],
    ['E001', 'Ana Cruz', 2, ''],
    ['E002', 'Luis Herrera', 1, ''],
    ['E003', 'Maria Gomez', 1, 75],
  ]);
  shares['!cols'] = columnWidths;
  const tips = XLSX.utils.aoa_to_sheet([
    ['Employee code', 'Employee name', 'Percent', 'Amount'],
    ['E001', 'Ana Cruz', 60, ''],
    ['E002', 'Luis Herrera', 40, ''],
    ['E003', 'Maria Gomez', 25, 150],
  ]);
  tips['!cols'] = columnWidths;
  const other = XLSX.utils.aoa_to_sheet([
    ['Employee code', 'Employee name', 'Shares', 'Amount'],
    ['E001', 'Ana Cruz', 2, ''],
    ['E002', 'Luis Herrera', 1, ''],
    ['E003', 'Maria Gomez', 1, 75],
  ]);
  other['!cols'] = columnWidths;
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, shares, 'Shares');
  XLSX.utils.book_append_sheet(workbook, tips, 'Tips');
  XLSX.utils.book_append_sheet(workbook, other, 'Other');
  XLSX.writeFile(workbook, 'payroll-pool-distribution-sample.xlsx');
}

function cellText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value).replace(/^\uFEFF/, '').trim();
  }
  return '';
}

function distributionSheet(workbook: XLSX.WorkBook, pool: PoolTotalRow): XLSX.WorkSheet | undefined {
  const names = workbook.SheetNames;
  const code = pool.code.toLowerCase();
  const name = pool.name.toLowerCase();
  const match = names.find((sheetName) => {
    const label = sheetName.toLowerCase();
    if (label === code || label === name || (code !== '' && label.includes(code))) return true;
    if (isTipsPool(pool)) return label.includes('tip');
    if (code.includes('share') || name.includes('share')) return label.includes('share');
    return label === 'other' || label.includes('other');
  });
  const selected = match ?? names.find((sheetName) => sheetName.toLowerCase().includes('share')) ?? names[0];
  return selected ? workbook.Sheets[selected] : undefined;
}

function shareFileLayout(row: unknown[]): { weight: number; amount: number } | null {
  const cells = [0, 1, 2, 3].map((index) => cellText(row?.[index]).toLowerCase());
  const header = cells.some((cell) => /code|employee|name|share|percent|point|amount/.test(cell));
  if (!header || !/code|employee|id/.test(cells[0] ?? '')) return null;
  const weight = cells.findIndex((cell) => /share|percent|point/.test(cell));
  if (weight < 1) return null;
  const amount = cells.findIndex((cell) => /amount|payout/.test(cell));
  return { weight, amount };
}

async function parseShareFile(
  file: File,
  pool: PoolTotalRow,
): Promise<Array<{ employeeCode: string; shares: number; amount: number | null }>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' });
  const sheet = distributionSheet(workbook, pool);
  if (!sheet) {
    throw new Error('The file has no rows.');
  }

  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    raw: false,
    defval: '',
  });
  const weightLabel = isTipsPool(pool) ? 'percentage' : 'share count';
  const parsed: Array<{ employeeCode: string; shares: number; amount: number | null }> = [];
  let weightColumn = 1;
  let amountColumn = 2;
  rows.forEach((row, index) => {
    if (index === 0) {
      const layout = shareFileLayout(row);
      if (layout) {
        weightColumn = layout.weight;
        amountColumn = layout.amount;
        return;
      }
      const second = cellText(row?.[1]).replace(/[%,]/g, '');
      const third = cellText(row?.[2]).replace(/[%,]/g, '');
      if (second !== '' && !Number.isFinite(Number(second)) && Number.isFinite(Number(third))) {
        weightColumn = 2;
        amountColumn = 3;
      }
    }
    const employeeCode = cellText(row?.[0]);
    const shareText = cellText(row?.[weightColumn]).replace(/%/g, '');
    const amountText = amountColumn >= 0 ? cellText(row?.[amountColumn]).replace(/[$,]/g, '') : '';
    if (!employeeCode && !shareText && !amountText) return;
    const shares = Number(shareText.replace(/,/g, ''));
    if (!employeeCode || !Number.isFinite(shares) || shares <= 0) {
      throw new Error(`Row ${index + 1} needs an employee code and a ${weightLabel} greater than zero.`);
    }
    let amount: number | null = null;
    if (amountText !== '') {
      amount = Number(amountText);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Row ${index + 1} has an amount that must be zero or greater.`);
      }
    }
    parsed.push({ employeeCode, shares, amount });
  });

  if (!parsed.length) {
    throw new Error(`The file needs at least one employee and a ${weightLabel}.`);
  }
  return parsed;
}

async function uploadShares(row: PoolTotalRow, file: File | File[] | null | undefined) {
  const selected = Array.isArray(file) ? file[0] ?? null : file ?? null;
  shareFiles[row.poolDistributionTypeId] = selected ?? null;
  delete shareErrors[row.poolDistributionTypeId];
  if (!selected || !props.payrollRunId) return;

  uploadingShareId.value = row.poolDistributionTypeId;
  try {
    const shares = await parseShareFile(selected, row);
    const mode = uploadMode[row.poolDistributionTypeId] ?? 'replace';
    const totalAmount = usesNextFileTotal(row)
      ? Number(nextFileTotals[row.poolDistributionTypeId] ?? 0)
      : Number(row.totalAmount) || 0;
    const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-shares`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        poolDistributionTypeId: row.poolDistributionTypeId,
        mode,
        totalAmount,
        sourceName: selected.name,
        shares,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const fieldError = body?.errors?.shares ?? body?.errors?.totalAmount;
      const message = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      throw new Error(typeof message === 'string' && message ? message : body?.message || 'Failed to save the distribution file.');
    }
    const data = await response.json();
    if (Array.isArray(data.totals)) {
      totals.value = data.totals.map((item: Record<string, unknown>) => mapPoolTotalRow(item));
      rememberUploadModes(totals.value);
    }
    shareFiles[row.poolDistributionTypeId] = null;
    nextFileTotals[row.poolDistributionTypeId] = 0;
    const action = mode === 'amend' ? 'Added' : 'Replaced with';
    $q.notify({
      color: 'positive',
      position: 'top',
      message: `${action} ${data.importedShareCount ?? shares.length} employees for ${row.name}. This file’s total is split only across those employees.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Share upload failed.';
    shareErrors[row.poolDistributionTypeId] = message;
    $q.notify({
      color: 'negative',
      position: 'top',
      message,
    });
  } finally {
    uploadingShareId.value = null;
  }
}

function rememberUploadModes(rows: PoolTotalRow[]) {
  for (const row of rows) {
    if (!uploadMode[row.poolDistributionTypeId]) {
      uploadMode[row.poolDistributionTypeId] = 'replace';
    }
  }
}

function rowsFromPoolTypes(types: PoolDistributionType[]): PoolTotalRow[] {
  return types
    .filter((type) => type.is_active && type.calculation_mode !== 'disabled')
    .map((type) => mapPoolTotalRow({
      ...type,
      poolDistributionTypeId: type.id,
      calculationMode: type.calculation_mode,
      requiresHoursEligibility: type.requires_hours_eligibility,
      totalAmount: 0,
      departmentShares: type.departmentShares ?? type.department_shares ?? [],
    }));
}

async function loadTotals() {
  loadError.value = null;
  if (!props.payrollRunId) {
    totals.value = [];
    distributions.value = [];
    departmentBreakdown.value = [];
    return;
  }

  isLoadingTotals.value = true;
  try {
    const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-totals`, {
      headers: headers(),
    });
    if (!response.ok) {
      throw new Error('Failed to load pool totals.');
    }
    const data = await response.json();
    const rows = (data.totals ?? data.data ?? []) as Record<string, unknown>[];
    totals.value = rows.map((row) => mapPoolTotalRow(row));

    if (!totals.value.length) {
      const types = await poolTypeStore.fetchAllActive();
      totals.value = rowsFromPoolTypes(types);
    }
    rememberUploadModes(totals.value);

    await loadDistributions();
  } catch (error) {
    try {
      const types = await poolTypeStore.fetchAllActive();
      totals.value = rowsFromPoolTypes(types);
      rememberUploadModes(totals.value);
      loadError.value = totals.value.length
        ? null
        : (error instanceof Error ? error.message : 'Failed to load pool totals.');
    } catch {
      totals.value = [];
      loadError.value = error instanceof Error ? error.message : 'Failed to load pool totals.';
    }
  } finally {
    isLoadingTotals.value = false;
  }
}

async function loadDistributions() {
  if (!props.payrollRunId) {
    distributions.value = [];
    departmentBreakdown.value = [];
    return;
  }
  const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-distributions`, {
    headers: headers(),
  });
  if (!response.ok) return;
  const data = await response.json();
  const rows = (data.data ?? data.distributions ?? []) as Record<string, unknown>[];
  replaceDistributions(rows.map((row) => mapDistribution(row)));
  rebuildDepartmentBreakdown(distributions.value);
}

async function saveDistribution(row: DistributionRow) {
  if (!props.payrollRunId) return;
  const draft = draftFor(row);
  const amount = parseDraftNumber(draft.amount);
  const paidShares = parseDraftNumber(draft.paidShares);
  const paidPercent = parseDraftNumber(draft.paidPercent);
  if (amount == null || amount < 0) {
    $q.notify({ color: 'negative', position: 'top', message: 'Enter an amount that is zero or greater.' });
    return;
  }
  if (paidShares != null && paidShares < 0) {
    $q.notify({ color: 'negative', position: 'top', message: 'Shares must be zero or greater.' });
    return;
  }
  if (paidPercent != null && (paidPercent < 0 || paidPercent > 100)) {
    $q.notify({ color: 'negative', position: 'top', message: 'Tip percent must be from 0 to 100.' });
    return;
  }

  savingDistributionId.value = row.id;
  try {
    const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-distributions/${row.id}`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        amount,
        paidShares,
        paidPercent,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const fieldError = body?.errors?.amount ?? body?.errors?.paidShares ?? body?.errors?.paidPercent;
      const detail = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      throw new Error(typeof detail === 'string' && detail ? detail : body?.message || 'Failed to save the correction.');
    }
    const data = await response.json();
    const saved = mapDistribution(data.distribution ?? {});
    distributions.value = distributions.value.map((item) => (item.id === saved.id ? saved : item));
    distributionDrafts[saved.id] = {
      paidShares: saved.paidShares == null ? '' : String(saved.paidShares),
      paidPercent: saved.paidPercent == null ? '' : String(saved.paidPercent),
      amount: formatMoney(saved.amount),
    };
    const pool = totals.value.find((item) => item.poolDistributionTypeId === Number(data.poolDistributionTypeId));
    if (pool && data.poolTotal != null) {
      pool.totalAmount = Number(data.poolTotal);
    }
    $q.notify({ color: 'positive', position: 'top', message: `Saved ${saved.employeeName || saved.employeeCode || 'employee'}.` });
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to save the correction.',
    });
  } finally {
    savingDistributionId.value = null;
  }
}

async function saveTotals() {
  if (!props.payrollRunId) return;
  saving.value = true;
  try {
    const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-totals`, {
      method: 'PUT',
      headers: headers(),
      body: JSON.stringify({
        totals: totals.value.map((row) => ({
          poolDistributionTypeId: row.poolDistributionTypeId,
          totalAmount: Number(row.totalAmount) || 0,
          notes: row.notes ?? null,
        })),
      }),
    });
    if (!response.ok) throw new Error('Failed to save pool totals.');
    const data = await response.json();
    totals.value = (data.totals ?? []).map((row: Record<string, unknown>) => mapPoolTotalRow(row));
    rememberUploadModes(totals.value);
    $q.notify({ color: 'positive', position: 'top', message: 'Pool totals saved.' });
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}

async function distribute() {
  if (!props.payrollRunId) return;
  distributing.value = true;
  try {
    await saveTotals();
    const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-distribute`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({}),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      const fieldError = body?.errors?.totalAmount ?? body?.errors?.shares;
      const detail = Array.isArray(fieldError) ? fieldError[0] : fieldError;
      const fallback = typeof body?.message === 'string' ? body.message : '';
      throw new Error(typeof detail === 'string' && detail ? detail : fallback || 'Failed to distribute pools.');
    }
    const data = await response.json();
    const distributed = (data.distributions ?? []) as Record<string, unknown>[];
    replaceDistributions(distributed.map((row) => mapDistribution(row)));
    departmentBreakdown.value = (data.departmentBreakdown ?? []).map((row: DepartmentBreakdownRow, index: number) => ({
      ...row,
      rowKey: `${row.poolDistributionTypeId ?? 'pool'}:${row.departmentId ?? index}`,
    }));
    if (!departmentBreakdown.value.length) {
      rebuildDepartmentBreakdown(distributions.value);
    }
    $q.notify({
      color: 'positive',
      position: 'top',
      message: `Distributed ${distributions.value.length} employee pool lines.`,
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Distribute failed.',
    });
  } finally {
    distributing.value = false;
  }
}

watch(() => props.payrollRunId, () => {
  void loadTotals();
}, { immediate: true });
</script>

<style scoped>
.pool-actions :deep(.q-btn) {
  width: 100%;
}

.pool-entries {
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.pool-entry {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px 24px;
  align-items: start;
  padding: 16px;
}

.pool-entry + .pool-entry {
  border-top: 1px solid rgba(0, 0, 0, 0.12);
}

.pool-entry__controls {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.pool-entry__controls :deep(.q-field) {
  margin: 0;
  padding-bottom: 0;
}

.pool-entry__controls > .pool-entry__modes.q-option-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
}

.pool-entry__controls > .pool-entry__modes.q-option-group :deep(> div) {
  margin: 0;
}

.pool-entry__controls > .pool-entry__modes :deep(.q-radio) {
  margin: 0;
  min-height: 0;
}

.pool-distribution-table :deep(td) {
  vertical-align: middle;
}

.pool-distribution-field {
  width: 140px;
}

@media (max-width: 1023px) {
  .pool-entry {
    grid-template-columns: 1fr;
  }
}
</style>
