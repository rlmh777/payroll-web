<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">{{ title }}</div>
      <q-btn
        color="primary"
        icon="add"
        label="Add Working Hours Timesheet"
        @click="openCreateDialog"
      />
    </div>

    <!-- <q-card v-if="!showTable" class="timesheet-card q-mb-lg" clickable @click="showTable = true">
      <q-card-section class="text-center">
        <q-icon name="schedule" size="44px" color="primary" />
        <div class="text-subtitle1 q-mt-sm">Define Working Hours Timesheet</div>
      </q-card-section>
    </q-card>

    <div v-else> -->
    <WorkTimesheetTable :rows="rows" @edit="openEditDialog" />
    <!-- </div> -->

    <WorkTimesheetDialog
      v-model="showDialog"
      :days="days"
      :title="selectedTimesheet ? 'Edit Working Hours Timesheet' : 'Add a Working Hours Timesheet'"
      :initial-value="selectedTimesheet"
      @save="saveTimesheet"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';
import WorkTimesheetDialog from 'src/components/settings/work-timesheet/WorkTimesheetDialog.vue';
import WorkTimesheetTable from 'src/components/settings/work-timesheet/WorkTimesheetTable.vue';

type WorkTimesheetForm = {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
};

type WorkTimesheetRow = {
  id: string;
  name: string;
  start: string;
  end: string;
  days: string[];
};

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {
    title: 'Define Working Hours Timesheet',
  },
);

const title = computed(() => props.title);

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const showDialog = ref(false);
const editingTimesheetId = ref<string | null>(null);
const selectedTimesheet = ref<WorkTimesheetForm | null>(null);
const workTimesheetStore = useWorkTimesheetStore();
const { workTimesheets, error } = storeToRefs(workTimesheetStore);
const $q = useQuasar();
const rows = computed(() =>
  workTimesheets.value.map((item) => ({
    id: item.id,
    name: item.name,
    start: item.start_time,
    end: item.end_time,
    days: Array.isArray(item.days) ? item.days : [],
  })),
);

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function openCreateDialog() {
  editingTimesheetId.value = null;
  selectedTimesheet.value = null;
  showDialog.value = true;
}

function openEditDialog(row: WorkTimesheetRow) {
  editingTimesheetId.value = row.id;
  selectedTimesheet.value = {
    name: row.name,
    startTime: normalizeTime(row.start),
    endTime: normalizeTime(row.end),
    days: [...row.days],
  };
  showDialog.value = true;
}

async function saveTimesheet(formData: WorkTimesheetForm) {
  if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
    $q.notify({ type: 'negative', message: 'Fill in name, start time, and end time.' });
    return;
  }

  const payload = {
    name: formData.name.trim(),
    start_time: normalizeTime(formData.startTime),
    end_time: normalizeTime(formData.endTime),
    days: formData.days,
  };
  const result = editingTimesheetId.value
    ? await workTimesheetStore.updateWorkTimesheet(editingTimesheetId.value, payload)
    : await workTimesheetStore.createWorkTimesheet(payload);

  if (result) {
    $q.notify({ type: 'positive', message: 'Work timesheet saved.' });
    showDialog.value = false;
    editingTimesheetId.value = null;
    selectedTimesheet.value = null;
  } else if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

onMounted(async () => {
  await workTimesheetStore.fetchWorkTimesheets();
});
</script>

<style scoped>
.timesheet-card {
  border-radius: 20px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
}
</style>
