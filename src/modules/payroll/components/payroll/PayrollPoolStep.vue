<template>
  <q-card flat bordered class="payroll-run-card q-mb-md">
    <q-card-section>
      <div class="row items-start q-col-gutter-lg">
        <div class="col-12 col-lg-4">
          <div class="text-overline text-primary">Pool distribution</div>
          <div class="text-h6 text-weight-bold">Enter pool totals</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Enter the period total for each configured pool (tips, shares, or custom types). Amounts are split by employee points × weight, subject to hours eligibility for base-rate staff.
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
            Select a pay period with a payroll run before entering pool totals.
          </q-banner>

          <q-list bordered separator>
            <q-item v-for="row in totals" :key="row.poolDistributionTypeId">
              <q-item-section>
                <q-item-label>{{ row.name }}</q-item-label>
                <q-item-label caption>
                  {{ row.code }} · {{ modeLabel(row.calculationMode) }}
                  <span v-if="row.requiresHoursEligibility"> · hours eligibility</span>
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
            <q-item v-if="!totals.length">
              <q-item-section class="text-grey-7">
                No active pool types. Configure them under Settings → Pool Distribution.
              </q-item-section>
            </q-item>
          </q-list>

          <q-table
            v-if="distributions.length"
            class="q-mt-md"
            title="Distribution preview"
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
import { onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useAuthStore } from '@core/stores/auth';
import { POOL_CALCULATION_MODE_OPTIONS } from '@payroll/stores/pool-distribution-type-store';

const props = defineProps<{
  payrollRunId: string | null;
  disabled?: boolean;
}>();

const $q = useQuasar();
const authStore = useAuthStore();
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

type PoolTotalRow = {
  poolDistributionTypeId: number;
  code: string;
  name: string;
  calculationMode: string;
  requiresHoursEligibility: boolean;
  totalAmount: number;
  notes?: string | null;
};

type DistributionRow = {
  id: string;
  employeeId: string;
  poolDistributionTypeId: number;
  points: number;
  weight: number;
  weightedPoints: number;
  amount: number;
  isEligible: boolean;
  eligibilityReason?: string | null;
};

const totals = ref<PoolTotalRow[]>([]);
const distributions = ref<DistributionRow[]>([]);
const saving = ref(false);
const distributing = ref(false);

const distributionColumns: QTableProps['columns'] = [
  { name: 'employeeId', label: 'Employee', field: 'employeeId', align: 'left' },
  { name: 'poolDistributionTypeId', label: 'Pool', field: 'poolDistributionTypeId', align: 'left' },
  { name: 'points', label: 'Points', field: (r) => Number(r.points).toFixed(2), align: 'right' },
  { name: 'weight', label: 'Weight', field: (r) => Number(r.weight).toFixed(2), align: 'right' },
  { name: 'amount', label: 'Amount', field: (r) => Number(r.amount).toFixed(2), align: 'right' },
  {
    name: 'eligible',
    label: 'Eligible',
    field: (r) => (r.isEligible ? 'Yes' : r.eligibilityReason || 'No'),
    align: 'left',
  },
];

function modeLabel(mode: string) {
  return POOL_CALCULATION_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode;
}

function headers(): HeadersInit {
  const result: HeadersInit = { 'Content-Type': 'application/json' };
  if (authStore.token) result.Authorization = `Bearer ${authStore.token}`;
  return result;
}

async function loadTotals() {
  if (!props.payrollRunId) {
    totals.value = [];
    distributions.value = [];
    return;
  }

  const response = await fetch(`${API_URL}/payroll-runs/${props.payrollRunId}/pool-totals`, {
    headers: headers(),
  });
  if (!response.ok) throw new Error('Failed to load pool totals.');
  const data = await response.json();
  totals.value = (data.totals ?? []).map((row: PoolTotalRow) => ({
    ...row,
    totalAmount: Number(row.totalAmount ?? 0),
  }));
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
    totals.value = (data.totals ?? []).map((row: PoolTotalRow) => ({
      ...row,
      totalAmount: Number(row.totalAmount ?? 0),
    }));
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
  void loadTotals().catch(() => {
    totals.value = [];
  });
}, { immediate: true });

onMounted(() => {
  void loadTotals().catch(() => undefined);
});
</script>
