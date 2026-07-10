<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false">
    <q-card class="department-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Department</div>
        <q-space />
        <q-btn flat round dense icon="close" :disable="store.isSaving" @click="closeDialog" />
      </q-card-section>

      <DepartmentForm
        v-model="form"
        :exclude-department-id="store.departmentToEdit?.id ?? null"
        :saving="store.isSaving"
        submit-label="Save"
        @submit="saveDepartment"
        @cancel="closeDialog"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useDepartmentStore, type Department, type DepartmentPayload } from 'src/stores/department-store';
import DepartmentForm from './DepartmentForm.vue';

const store = useDepartmentStore();
const $q = useQuasar();
const form = ref<DepartmentPayload>(emptyForm());

const isOpen = computed({
  get: () => !!store.departmentToEdit,
  set: (value: boolean) => {
    if (!value) {
      closeDialog();
    }
  },
});

function emptyForm(): DepartmentPayload {
  return {
    name: '',
    parentId: null,
    accountId: null,
    timesheet_template_id: null,
    totalDailyHoursBeforeOvertime: 9,
    totalWeeklyHoursBeforeOvertime: 45,
    overtimeThresholdMode: 'DAILY_AND_WEEKLY',
    overnightShiftMode: 'SPLIT_AT_MIDNIGHT',
    includeLunchHour: true,
    lunchHourHours: 1,
  };
}

function departmentToForm(department: Department): DepartmentPayload {
  return {
    name: department.name,
    parentId: department.parentId ?? null,
    accountId: department.accountId ?? null,
    timesheet_template_id:
      department.current_timesheet_template_assignment?.timesheet_template_id ??
      department.current_timesheet_template_assignment?.timesheet_template?.id ??
      null,
    totalDailyHoursBeforeOvertime: department.totalDailyHoursBeforeOvertime ?? 9,
    totalWeeklyHoursBeforeOvertime: department.totalWeeklyHoursBeforeOvertime ?? 45,
    overtimeThresholdMode: department.overtimeThresholdMode ?? 'DAILY_AND_WEEKLY',
    overnightShiftMode: department.overnightShiftMode ?? 'SPLIT_AT_MIDNIGHT',
    includeLunchHour: department.includeLunchHour ?? true,
    lunchHourHours: department.lunchHourHours ?? 1,
  };
}

function closeDialog() {
  store.setDepartmentToEdit(null);
  form.value = emptyForm();
}

async function saveDepartment() {
  if (!store.departmentToEdit) {
    return;
  }

  const result = await store.updateDepartment(store.departmentToEdit.id, {
    ...form.value,
    name: form.value.name.trim(),
  });

  if (result) {
    $q.notify({ type: 'positive', message: 'Department saved.' });
    closeDialog();
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

watch(
  () => store.departmentToEdit,
  (department) => {
    form.value = department ? departmentToForm(department) : emptyForm();
  },
  { immediate: true },
);
</script>

<style scoped>
.department-dialog-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.department-dialog-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
