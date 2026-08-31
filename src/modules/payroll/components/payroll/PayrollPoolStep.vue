<template>
  <q-card flat bordered class="payroll-run-card q-mb-md">
    <q-card-section>
      <div class="row items-start q-col-gutter-lg">
        <div class="col-12 col-lg-4">
          <div class="text-overline text-primary">Pool distribution</div>
          <div class="text-h6 text-weight-bold">Enter pool totals</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Enter one period total for tips. Department percentages must add to 100%. Sub-departments inherit the parent split unless they have their own percentage. Only employees who worked the period are paid; active employees who did not work still appear with $0.
          </div>
          <div class="q-mt-md column q-gutter-sm">
            <q-btn
              unelevated
              color="primary"
              icon="save"
              label="Save totals"
              :loading="saving"
              :disable="disabled || !payrollRunId"
              @click="saveTotals"
            />
            <q-btn
              outline
              color="primary"
              icon="pie_chart"
              label="Distribute"
              :loading="distributing"
              :disable="disabled || !payrollRunId"
              @click="distribute"
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

          <q-list bordered separator>
            <q-item v-for="row in totals" :key="row.poolDistributionTypeId">
              <q-item-section>
                <q-item-label>{{ row.name }}</q-item-label>
                <q-item-label caption>
                  {{ row.code }} · {{ modeLabel(row.calculationMode) }}
                  <span v-if="row.requiresHoursEligibility"> · hours eligibility</span>
                </q-item-label>
                <q-item-label
                  v-if="row.calculationMode === 'department_equal_share'"
                  caption
                >
                  {{ departmentShareCaption(row) }}
                </q-item-label>
              </q-item-section>
              <q-item-section side style="min-width: 180px">
                <q-input
                  v-model.number="row.totalAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  dense
                  outlined
                  prefix="$"
                  :disable="disabled || row.calculationMode === 'manual' || row.calculationMode === 'disabled'"
                />
              </q-item-section>
            </q-item>
            <q-item v-if="payrollRunId && !totals.length && !isLoadingTotals">
              <q-item-section class="text-grey-7">
                No active pool types. Configure them under Settings → General → Pool Distribution.
              </q-item-section>
            </q-item>
          </q-list>

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

          <q-table
            v-if="distributions.length"
            class="q-mt-md"
            title="Employee distribution"
            :rows="distributions"
            :columns="distributionColumns"
            row-key="id"
            flat
            bordered
            dense
            :rows-per-page-options="[10, 25, 50]"
          />
        </div>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
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
  amount: number;
  isEligible: boolean;
  eligibilityReason?: string | null;
};

const totals = ref<PoolTotalRow[]>([]);
const distributions = ref<DistributionRow[]>([]);
const departmentBreakdown = ref<DepartmentBreakdownRow[]>([]);
const saving = ref(false);
const distributing = ref(false);
const isLoadingTotals = ref(false);
const loadError = ref<string | null>(null);

const departmentColumns: QTableProps['columns'] = [
  { name: 'poolName', label: 'Pool', field: (row) => row.poolName || '—', align: 'left' },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' },
  { name: 'percent', label: '%', field: (row) => `${Number(row.percent).toFixed(2)}%`, align: 'right' },
  { name: 'departmentAmount', label: 'Amount', field: (row) => Number(row.departmentAmount).toFixed(2), align: 'right' },
  { name: 'workingCount', label: 'Working', field: 'workingCount', align: 'right' },
  { name: 'listedCount', label: 'Listed', field: 'listedCount', align: 'right' },
];

const distributionColumns: QTableProps['columns'] = [
  { name: 'employeeName', label: 'Employee', field: (row) => row.employeeName || row.employeeCode || row.employeeId, align: 'left' },
  { name: 'poolName', label: 'Pool', field: (row) => row.poolName || row.poolDistributionTypeId, align: 'left' },
  { name: 'departmentName', label: 'Department', field: (row) => row.departmentName || '—', align: 'left' },
  { name: 'departmentPercent', label: 'Dept %', field: (row) => row.departmentPercent == null ? '—' : `${Number(row.departmentPercent).toFixed(2)}%`, align: 'right' },
  { name: 'departmentAmount', label: 'Dept amount', field: (row) => row.departmentAmount == null ? '—' : Number(row.departmentAmount).toFixed(2), align: 'right' },
  { name: 'workedThisPeriod', label: 'Worked', field: (row) => (row.workedThisPeriod ? 'Yes' : 'No'), align: 'left' },
  { name: 'amount', label: 'Amount', field: (row) => Number(row.amount).toFixed(2), align: 'right' },
  {
    name: 'eligible',
    label: 'Status',
    field: (row) => (row.isEligible ? 'Paid' : row.eligibilityReason || 'Not paid'),
    align: 'left',
  },
];

function modeLabel(mode: string) {
  return POOL_CALCULATION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
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
    totalAmount: Number(row.totalAmount ?? row.total_amount ?? 0),
    notes: asNullableText(row.notes),
    departmentShares: mapDepartmentShares(row),
  };
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

    await loadDistributions();
  } catch (error) {
    try {
      const types = await poolTypeStore.fetchAllActive();
      totals.value = rowsFromPoolTypes(types);
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
  distributions.value = data.data ?? data.distributions ?? [];
  rebuildDepartmentBreakdown(distributions.value);
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
      throw new Error(body.message || 'Failed to distribute pools.');
    }
    const data = await response.json();
    distributions.value = data.distributions ?? [];
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
