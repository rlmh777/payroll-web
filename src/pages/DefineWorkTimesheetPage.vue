<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">{{ title }}</div>
      <q-btn
        v-if="showTable"
        color="primary"
        icon="add"
        label="Add"
        @click="showDialog = true"
      />
    </div>

    <q-card
      v-if="!showTable"
      class="timesheet-card q-mb-lg"
      clickable
      @click="showTable = true"
    >
      <q-card-section class="text-center">
        <q-icon name="schedule" size="44px" color="primary" />
        <div class="text-subtitle1 q-mt-sm">Define Work Timesheet</div>
      </q-card-section>
    </q-card>

    <div v-else>
      <WorkTimesheetTable :rows="rows" />
    </div>

    <WorkTimesheetDialog v-model="showDialog" :days="days" @save="saveTimesheet" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';
import WorkTimesheetDialog from 'src/components/settings/calendar/WorkTimesheetDialog.vue';
import WorkTimesheetTable from 'src/components/settings/calendar/WorkTimesheetTable.vue';

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {
    title: 'Define Work Timesheet',
  },
);

const title = computed(() => props.title);

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const showDialog = ref(false);
const showTable = ref(false);
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

async function saveTimesheet(formData: {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  days: string[];
}) {
  if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
    $q.notify({ type: 'negative', message: 'Fill in name, start time, and end time.' });
    return;
  }

  const result = await workTimesheetStore.createWorkTimesheet({
    name: formData.name.trim(),
    start_time: formData.startTime,
    end_time: formData.endTime,
    break_minutes: formData.breakMinutes,
    days: formData.days,
  });

  if (result) {
    $q.notify({ type: 'positive', message: 'Work timesheet saved.' });
    showDialog.value = false;
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
