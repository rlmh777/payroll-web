<template>
  <div class="q-mt-xl">
    <div class="row items-center q-mb-md q-gutter-sm">
      <div class="col">
        <div class="text-h6">Worked hours bank</div>
        <div class="text-caption text-grey-7">
          Surplus hours above expected weekly hours accrue here and can cover short weeks or leave. Shortfalls without bank hours reduce pool eligibility for gated pool types.
        </div>
      </div>
      <div class="text-h5 text-weight-bold">{{ balanceLabel }}</div>
      <q-btn outline color="primary" icon="tune" label="Adjust" dense @click="adjustOpen = true" />
    </div>

    <q-table
      :rows="store.hoursBank?.ledger ?? []"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoadingHoursBank"
      no-data-label="No hours bank ledger entries"
      :pagination="{ rowsPerPage: 20 }"
    />

    <q-dialog v-model="adjustOpen">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Adjust hours bank</div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model.number="adjustHours" type="number" step="0.25" label="Hours (+/−)" outlined dense />
          <q-input v-model="adjustNotes" type="textarea" label="Notes" outlined dense autogrow />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" :loading="saving" @click="onAdjust" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useEmployeePoolStore } from '@payroll/stores/employee-pool-store';

const props = defineProps<{ employeeId: string }>();
const $q = useQuasar();
const store = useEmployeePoolStore();

const adjustOpen = ref(false);
const saving = ref(false);
const adjustHours = ref(0);
const adjustNotes = ref('');

const balanceLabel = computed(() =>
  `${Number(store.hoursBank?.balanceHours ?? 0).toFixed(2)} hrs`,
);

const columns: QTableProps['columns'] = [
  { name: 'entryDate', label: 'Date', field: 'entryDate', align: 'left' },
  { name: 'entryType', label: 'Type', field: 'entryType', align: 'left' },
  { name: 'hoursDelta', label: 'Delta', field: (row) => Number(row.hoursDelta).toFixed(2), align: 'right' },
  { name: 'balanceAfter', label: 'Balance', field: (row) => Number(row.balanceAfter).toFixed(2), align: 'right' },
  {
    name: 'worked',
    label: 'Worked / Expected',
    field: (row) => {
      if (row.workedHours == null && row.expectedHours == null) return '—';
      return `${Number(row.workedHours ?? 0).toFixed(1)} / ${Number(row.expectedHours ?? 0).toFixed(1)}`;
    },
    align: 'right',
  },
  { name: 'notes', label: 'Notes', field: (row) => row.notes || '—', align: 'left' },
];

async function refresh() {
  await store.fetchHoursBank(props.employeeId);
}

async function onAdjust() {
  saving.value = true;
  try {
    await store.adjustHoursBank(props.employeeId, Number(adjustHours.value), adjustNotes.value || undefined);
    $q.notify({ color: 'positive', position: 'top', message: 'Hours bank updated.' });
    adjustOpen.value = false;
    adjustHours.value = 0;
    adjustNotes.value = '';
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Adjust failed.',
    });
  } finally {
    saving.value = false;
  }
}

watch(() => props.employeeId, refresh, { immediate: true });
</script>
