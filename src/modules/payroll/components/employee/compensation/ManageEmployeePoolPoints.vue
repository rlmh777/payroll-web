<template>
  <div class="q-mt-xl">
    <div class="row items-center q-mb-md q-gutter-sm">
      <div class="col">
        <div class="text-h6">Pool points history</div>
        <div class="text-caption text-grey-7">
          Shares use points. Tips also store a tip percent on the employee. Payroll records that percent when tips are distributed without an uploaded file.
        </div>
      </div>
      <q-btn color="primary" icon="add" label="Add points" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.points"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoadingPoints"
      no-data-label="No pool points recorded"
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogOpen" position="right">
      <q-card style="width: min(420px, 100vw)">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editingId ? 'Edit points' : 'Add points' }}</div>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="onSave">
            <q-select
              v-model="form.pool_distribution_type_id"
              :options="typeOptions"
              emit-value
              map-options
              label="Pool type *"
              outlined
              dense
              :disable="Boolean(editingId)"
              :rules="[(v) => !!v || 'Required']"
            />
            <q-input
              v-if="selectedIsTips"
              v-model.number="form.tip_percent"
              type="number"
              step="0.01"
              min="0"
              max="100"
              label="Tip percent *"
              outlined
              dense
              hint="Saved on this employee and copied onto each tips payroll that is distributed without a file."
              :rules="[(v) => v !== null && v !== '' && Number(v) >= 0 && Number(v) <= 100 || 'Enter a percent from 0 to 100']"
            />
            <q-input
              v-model.number="form.points"
              type="number"
              step="0.0001"
              min="0"
              :label="selectedIsTips ? 'Points' : 'Points *'"
              outlined
              dense
              :rules="[(v) => selectedIsTips || (v !== null && v !== '' && Number(v) >= 0) || 'Required']"
            />
            <q-input
              v-model.number="form.weight"
              type="number"
              step="0.0001"
              min="0"
              label="Weight"
              outlined
              dense
              hint="Weighted points = points × weight"
            />
            <DateField
              v-model="form.effective_date"
              label="Effective date *"
              required
            />
            <DateField
              v-model="form.end_date"
              label="End date"
              clearable
              :rules="[
                (val) =>
                  !val
                  || !form.effective_date
                  || val >= form.effective_date
                  || 'End date must be on or after effective date',
              ]"
            />
            <q-input v-model="form.notes" type="textarea" label="Notes" outlined dense autogrow />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" v-close-popup />
              <q-btn type="submit" color="primary" label="Save" :loading="saving" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import { useEmployeePoolStore, type EmployeePoolPoint } from '@payroll/stores/employee-pool-store';
import { usePoolDistributionTypeStore } from '@payroll/stores/pool-distribution-type-store';

const props = defineProps<{ employeeId: string }>();
const $q = useQuasar();
const store = useEmployeePoolStore();
const typeStore = usePoolDistributionTypeStore();

const dialogOpen = ref(false);
const saving = ref(false);
const editingId = ref<string | null>(null);
const typeOptions = ref<Array<{ label: string; value: number; code: string }>>([]);

const form = reactive({
  pool_distribution_type_id: null as number | null,
  points: 0,
  tip_percent: null as number | null,
  weight: 1,
  effective_date: new Date().toISOString().slice(0, 10) as string | null,
  end_date: null as string | null,
  notes: '',
});

const columns: QTableProps['columns'] = [
  {
    name: 'type',
    label: 'Pool',
    field: (row: EmployeePoolPoint) =>
      row.poolDistributionType?.name || row.pool_distribution_type?.name || row.pool_distribution_type_id,
    align: 'left',
  },
  { name: 'points', label: 'Points', field: (row) => Number(row.points).toFixed(4), align: 'right' },
  {
    name: 'tip_percent',
    label: 'Tip %',
    field: (row) => row.tip_percent == null || row.tip_percent === '' ? '—' : `${Number(row.tip_percent)}%`,
    align: 'right',
  },
  { name: 'weight', label: 'Weight', field: (row) => Number(row.weight).toFixed(4), align: 'right' },
  {
    name: 'weighted',
    label: 'Weighted',
    field: (row) => (Number(row.points) * Number(row.weight)).toFixed(4),
    align: 'right',
  },
  { name: 'effective_date', label: 'Effective', field: 'effective_date', align: 'left' },
  { name: 'end_date', label: 'End', field: (row) => row.end_date || '—', align: 'left' },
  { name: 'notes', label: 'Notes', field: (row) => row.notes || '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

async function refresh() {
  await store.fetchPoints(props.employeeId);
}

const selectedIsTips = computed(() => {
  const selected = typeOptions.value.find((type) => type.value === form.pool_distribution_type_id);
  if (!selected) return false;
  return selected.code.toUpperCase() === 'TIPS' || selected.label.toLowerCase().includes('tip');
});

function openCreate() {
  editingId.value = null;
  form.pool_distribution_type_id = typeOptions.value[0]?.value ?? null;
  form.points = 0;
  form.tip_percent = null;
  form.weight = 1;
  form.effective_date = new Date().toISOString().slice(0, 10);
  form.end_date = null;
  form.notes = '';
  dialogOpen.value = true;
}

function openEdit(row: EmployeePoolPoint) {
  editingId.value = row.id;
  form.pool_distribution_type_id = row.pool_distribution_type_id;
  form.points = Number(row.points);
  form.tip_percent = row.tip_percent == null || row.tip_percent === '' ? null : Number(row.tip_percent);
  form.weight = Number(row.weight);
  form.effective_date = String(row.effective_date).slice(0, 10);
  form.end_date = row.end_date ? String(row.end_date).slice(0, 10) : null;
  form.notes = row.notes ?? '';
  dialogOpen.value = true;
}

async function onSave() {
  if (!form.pool_distribution_type_id || !form.effective_date) return;
  saving.value = true;
  try {
    if (editingId.value) {
      await store.updatePoint(editingId.value, {
        points: Number(form.points) || 0,
        weight: Number(form.weight),
        tip_percent: selectedIsTips.value ? Number(form.tip_percent) : null,
        effective_date: form.effective_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      });
    } else {
      await store.createPoint({
        employee_id: props.employeeId,
        pool_distribution_type_id: form.pool_distribution_type_id,
        points: Number(form.points) || 0,
        weight: Number(form.weight),
        tip_percent: selectedIsTips.value ? Number(form.tip_percent) : null,
        effective_date: form.effective_date,
        end_date: form.end_date || null,
        notes: form.notes || null,
      });
    }
    $q.notify({ color: 'positive', position: 'top', message: 'Pool points saved.' });
    dialogOpen.value = false;
    await refresh();
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

function onDelete(row: EmployeePoolPoint) {
  $q.dialog({
    title: 'Delete points',
    message: 'Remove this points history row?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      await store.deletePoint(row.id);
      await refresh();
    })();
  });
}

watch(() => props.employeeId, refresh, { immediate: true });

onMounted(async () => {
  const types = await typeStore.fetchAllActive();
  typeOptions.value = types.map((type) => ({
    label: `${type.name} (${type.code})`,
    value: type.id,
    code: type.code,
  }));
});
</script>
