<template>
  <q-card flat bordered class="q-mb-md">
    <q-card-section class="row items-center q-gutter-sm">
      <div class="text-subtitle1">Leave balances</div>
      <q-space />
      <span v-if="store.asOf" class="text-caption text-grey-7">As of {{ store.asOf }}</span>
      <q-btn flat dense icon="refresh" :loading="store.isLoading" @click="refresh" />
    </q-card-section>
    <q-card-section class="q-pt-none">
      <q-table
        :rows="balanceRows"
        :columns="columns"
        row-key="leaveTypeId"
        flat
        dense
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
        :loading="store.isLoading"
        no-data-label="No leave balances"
      >
        <template #body-cell-availableDays="props">
          <q-td :props="props">
            <span :class="props.row.affectsBalance && props.row.availableDays <= 0 ? 'text-negative' : ''">
              {{ props.row.affectsBalance ? formatLeaveDays(props.row.availableDays) : '—' }}
            </span>
          </q-td>
        </template>
        <template #body-cell-accrualMethod="props">
          <q-td :props="props">{{ formatAccrualMethod(props.row.accrualMethod) }}</q-td>
        </template>
      </q-table>
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import type { QTableProps } from 'quasar';
import { useLeaveBalanceStore } from 'src/stores/leave-balance-store';
import { formatAccrualMethod, formatLeaveDays } from '@hr/components/settings/leave/leave-type-form';

const props = defineProps<{ employeeId: string }>();
const store = useLeaveBalanceStore();

const balanceRows = computed(() => store.balances);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Leave type', field: 'name', align: 'left' },
  { name: 'annualEntitlementDays', label: 'Annual', field: (r) => formatLeaveDays(r.annualEntitlementDays), align: 'right' },
  { name: 'accruedDays', label: 'Accrued', field: (r) => r.affectsBalance ? formatLeaveDays(r.accruedDays) : '—', align: 'right' },
  { name: 'takenDays', label: 'Taken', field: (r) => formatLeaveDays(r.takenDays), align: 'right' },
  { name: 'scheduledDays', label: 'Scheduled', field: (r) => formatLeaveDays(r.scheduledDays), align: 'right' },
  { name: 'availableDays', label: 'Available', field: 'availableDays', align: 'right' },
  { name: 'accrualMethod', label: 'Accrual', field: 'accrualMethod', align: 'left' },
];

async function refresh() {
  if (!props.employeeId) return;
  await store.fetchByEmployee(props.employeeId);
}

watch(() => props.employeeId, refresh, { immediate: true });

defineExpose({ refresh });
</script>
