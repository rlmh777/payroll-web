<template>
  <div class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Work Shift to Departments</div>
      <q-btn color="primary" icon="add" label="Add" @click="showDialog = true" />
    </div>

    <WorkShiftDepartmentTable :rows="rows" />

    <WorkShiftDepartmentDialog
      v-model="showDialog"
      :shift-options="shiftOptions"
      :department-options="departmentOptions"
      @save="saveAssignment"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';
import { useWorkShiftDepartmentStore } from 'src/stores/work-shift-department-store';
import WorkShiftDepartmentDialog from 'src/components/settings/calendar/WorkShiftDepartmentDialog.vue';
import WorkShiftDepartmentTable from 'src/components/settings/calendar/WorkShiftDepartmentTable.vue';

const showDialog = ref(false);
const workTimesheetStore = useWorkTimesheetStore();
const workShiftStore = useWorkShiftDepartmentStore();
const { workTimesheets } = storeToRefs(workTimesheetStore);
const { assignments, departments, error } = storeToRefs(workShiftStore);
const $q = useQuasar();
const shiftOptions = computed(() =>
  workTimesheets.value.map((item) => ({ label: item.name, value: item.id })),
);
const departmentOptions = computed(() =>
  departments.value.map((item) => ({ label: item.name, value: item.id })),
);
const rows = computed(() =>
  assignments.value.map((item) => ({
    id: item.id,
    shift: item.work_timesheet?.name ?? '',
    departments: item.department?.name ?? '',
    effective: item.effective_date,
  })),
);

async function loadPageData() {
  await Promise.all([
    workTimesheetStore.fetchWorkTimesheets(),
    workShiftStore.fetchDepartments(),
    workShiftStore.fetchAssignments(),
  ]);

  if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

async function saveAssignment(payload: {
  shift: string;
  departments: number[];
  effectiveDate: string;
  notes: string;
}) {
  if (!payload.shift || !payload.departments.length || !payload.effectiveDate) {
    $q.notify({ type: 'negative', message: 'Select timesheet, departments, and effective date.' });
    return;
  }

  const success = await workShiftStore.createAssignments({
    work_timesheet_id: payload.shift,
    department_ids: payload.departments,
    effective_date: payload.effectiveDate,
    notes: payload.notes,
  });

  if (success) {
    $q.notify({ type: 'positive', message: 'Work shift assigned.' });
    showDialog.value = false;
  } else if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

onMounted(loadPageData);
</script>
