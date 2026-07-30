<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add Compensation" dense @click="store.openCreateDialog()" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No compensation records"
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-isActive="props">
        <q-td :props="props">
          <q-icon
            :name="props.row.isActive ? 'check_circle' : 'cancel'"
            :color="props.row.isActive ? 'positive' : 'grey'"
          />
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn
            v-if="props.row.isActive"
            flat
            round
            dense
            icon="edit"
            color="primary"
            size="sm"
            @click="store.setRecordToEdit(props.row)"
          />
          <q-btn
            v-if="!props.row.isActive"
            flat
            round
            dense
            icon="delete"
            color="negative"
            size="sm"
            @click="onDelete(props.row)"
          />
        </q-td>
      </template>
    </q-table>

    <AddEmployeeCompensation
      :employee-id="employeeId"
      :employment-details="employmentDetailStore.records"
      :payrate-frequency-name="payrateFrequencyName"
      @saved="refresh"
    />
    <EditEmployeeCompensation
      :employment-details="employmentDetailStore.records"
      :payrate-frequency-name="payrateFrequencyName"
      @saved="refresh"
    />

    <ManageEmployeePoolPoints :employee-id="employeeId" />
    <ManageEmployeeHoursBank :employee-id="employeeId" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useEmployeeCompensationStore,
  type EmployeeCompensation,
} from 'src/stores/employee-compensation-store';
import { useEmploymentDetailStore } from 'src/stores/employment-detail-store';
import { useEmployeeStore } from '@hr/stores/employee-store';
import { usePayrateFrequencyStore } from 'src/stores/payrate-frequency-store';
import AddEmployeeCompensation from './AddEmployeeCompensation.vue';
import EditEmployeeCompensation from './EditEmployeeCompensation.vue';
import ManageEmployeePoolPoints from './ManageEmployeePoolPoints.vue';
import ManageEmployeeHoursBank from './ManageEmployeeHoursBank.vue';
import {
  formatCompensationMethod,
  formatCompensationReason,
  formatHourlyRate,
  formatYearlyRate,
} from './compensation-form';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeCompensationStore();
const employmentDetailStore = useEmploymentDetailStore();
const employeeStore = useEmployeeStore();
const payrateFrequencyStore = usePayrateFrequencyStore();
const $q = useQuasar();

const payrateFrequencyName = computed(() => {
  const employee = employeeStore.selectedEmployee;
  if (!employee || employee.id !== props.employeeId) {
    return null;
  }

  const frequencyId = Number(employee.payrateFrequencyId);
  const frequency = payrateFrequencyStore.payrateFrequencies.find((entry) => entry.id === frequencyId);

  return frequency?.name ?? null;
});

const columns: QTableProps['columns'] = [
  { name: 'employmentDetail', label: 'Contract', field: (r) => formatEmploymentDetailLabel(r), align: 'left' },
  { name: 'effectiveDate', label: 'Effective', field: 'effectiveDate', align: 'left' },
  { name: 'endDate', label: 'End', field: (r) => r.endDate ?? '—', align: 'left' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'requiresClocking', label: 'Clocking', field: (r) => r.requiresClocking ? 'Required' : 'Optional', align: 'left' },
  { name: 'compensationMethod', label: 'Payment method', field: (r) => formatCompensationMethod(r.compensationMethod), align: 'left' },
  { name: 'payscale', label: 'Payscale', field: (r) => r.payscale ?? '—', align: 'left' },
  { name: 'payscalePoint', label: 'Point', field: (r) => r.payscalePoint ?? '—', align: 'left' },
  { name: 'reasonType', label: 'Reason', field: (r) => formatCompensationReason(r.reasonType), align: 'left' },
  { name: 'hourlyRate', label: 'Rate', field: (r) => formatHourlyRate(r), align: 'right' },
  { name: 'yearlyRate', label: 'Annual base', field: (r) => Number(r.yearlyRate) > 0 ? formatYearlyRate(r.yearlyRate) : '—', align: 'right' },
  { name: 'standardWeeklyHours', label: 'Std weekly hrs', field: (r) => Number(r.standardWeeklyHours ?? 0) > 0 ? Number(r.standardWeeklyHours ?? 40).toFixed(1) : '—', align: 'right' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await Promise.all([
    employmentDetailStore.fetchByEmployee(props.employeeId),
    store.fetchByEmployee(props.employeeId),
  ]);
}

function formatEmploymentDetailLabel(record: EmployeeCompensation): string {
  const detail = record.employmentDetail;
  if (!detail) return '—';

  const title = (typeof detail.jobTitle === 'object' ? detail.jobTitle?.name : detail.jobTitle)
    || detail.contractType?.name
    || 'Contract';
  const department = detail.department?.name ?? 'No department';
  const payPeriodGroup = detail.defaultPayPeriodGroup?.name ?? 'No pay period group';

  return `${title} - ${department} - ${payPeriodGroup}`;
}

function onDelete(row: EmployeeCompensation) {
  $q.dialog({
    title: 'Confirm Delete',
    message: 'Delete this historical compensation record?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Compensation record deleted.' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

watch(() => props.employeeId, refresh, { immediate: true });

onMounted(async () => {
  if (payrateFrequencyStore.payrateFrequencies.length === 0) {
    await payrateFrequencyStore.fetchPayrateFrequencies();
  }
});
</script>
