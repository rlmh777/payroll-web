<template>
  <div class="employment-leave-entitlements q-mt-lg">
    <div class="text-subtitle2 q-mb-sm">Leave entitlements (contract overrides)</div>
    <p class="text-caption text-grey-7 q-mb-md">
      Organization defaults apply unless overridden below. Vacation accrues monthly from the contract start date.
    </p>

    <q-table
      :rows="rows"
      :columns="columns"
      row-key="leaveTypeId"
      flat
      bordered
      dense
      hide-pagination
      :pagination="{ rowsPerPage: 0 }"
      :loading="entitlementStore.isLoading"
      no-data-label="No leave types configured"
    >
      <template #body-cell-useOrgDefault="props">
        <q-td :props="props">
          <q-toggle
            v-model="props.row.useOrgDefault"
            dense
            :disable="disable"
            @update:model-value="onToggleOrgDefault(props.row)"
          />
        </q-td>
      </template>
      <template #body-cell-annualEntitlementDays="props">
        <q-td :props="props">
          <q-input
            v-model.number="props.row.annualEntitlementDays"
            type="number"
            min="0"
            step="0.5"
            dense
            outlined
            :disable="disable || props.row.useOrgDefault"
            style="max-width: 110px"
          />
        </q-td>
      </template>
      <template #body-cell-accrualMethod="props">
        <q-td :props="props">
          <q-select
            v-model="props.row.accrualMethod"
            :options="accrualOptions"
            dense
            outlined
            emit-value
            map-options
            :disable="disable || props.row.useOrgDefault"
            style="min-width: 180px"
          />
        </q-td>
      </template>
      <template #body-cell-orgDefault="props">
        <q-td :props="props">
          {{ formatLeaveDays(props.row.orgAnnualEntitlementDays) }} · {{ formatAccrualMethod(props.row.orgAccrualMethod) }}
        </q-td>
      </template>
    </q-table>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { QTableProps } from 'quasar';
import { useEmploymentLeaveEntitlementStore } from 'src/stores/employment-leave-entitlement-store';
import {
  LEAVE_ACCRUAL_OPTIONS,
  formatAccrualMethod,
  formatLeaveDays,
  type ContractLeaveEntitlementRow,
} from 'src/components/settings/leave/leave-type-form';

const props = defineProps<{
  employmentDetailId?: string | null;
  disable?: boolean;
}>();

const entitlementStore = useEmploymentLeaveEntitlementStore();
const accrualOptions = LEAVE_ACCRUAL_OPTIONS;

const rows = computed(() => entitlementStore.rows);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Leave type', field: 'name', align: 'left' },
  { name: 'orgDefault', label: 'Org default', field: 'orgDefault', align: 'left' },
  { name: 'useOrgDefault', label: 'Use org default', field: 'useOrgDefault', align: 'center' },
  { name: 'annualEntitlementDays', label: 'Contract days', field: 'annualEntitlementDays', align: 'right' },
  { name: 'accrualMethod', label: 'Accrual', field: 'accrualMethod', align: 'left' },
];

watch(() => props.employmentDetailId, (id) => {
  if (id) void entitlementStore.fetchByContract(id);
}, { immediate: true });

function onToggleOrgDefault(row: ContractLeaveEntitlementRow) {
  if (row.useOrgDefault) {
    row.annualEntitlementDays = null;
    row.accrualMethod = null;
    return;
  }

  row.annualEntitlementDays = row.orgAnnualEntitlementDays;
  row.accrualMethod = row.orgAccrualMethod;
}

async function saveEntitlements(employmentDetailId: string) {
  await entitlementStore.save(
    employmentDetailId,
    rows.value.map((row) => ({
      leaveTypeId: row.leaveTypeId,
      useOrgDefault: row.useOrgDefault,
      annualEntitlementDays: row.useOrgDefault ? null : row.annualEntitlementDays,
      accrualMethod: row.useOrgDefault ? null : row.accrualMethod,
    })),
  );
}

defineExpose({ saveEntitlements });
</script>
