<template>
  <div>
    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add skill" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No skills"
    >
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <SkillFormDialog
      v-model="dialogOpen"
      :employee-id="employeeId"
      :record="selectedRecord"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import SkillFormDialog from './SkillFormDialog.vue';
import { useEmployeeSkillStore, type EmployeeSkill } from 'src/stores/employee-skill-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeSkillStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const selectedRecord = ref<EmployeeSkill | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Skill', field: 'name', align: 'left' },
  { name: 'proficiencyLevel', label: 'Proficiency', field: (r) => r.proficiencyLevel ?? '—', align: 'left' },
  { name: 'yearsExperience', label: 'Years', field: (r) => r.yearsExperience ?? '—', align: 'right' },
  { name: 'notes', label: 'Notes', field: (r) => r.notes ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function openCreate() {
  selectedRecord.value = null;
  dialogOpen.value = true;
}

function openEdit(record: EmployeeSkill) {
  selectedRecord.value = record;
  dialogOpen.value = true;
}

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeSkill) {
  $q.dialog({
    title: 'Confirm delete',
    message: 'Delete this skill?',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Record deleted.' });
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
</script>
