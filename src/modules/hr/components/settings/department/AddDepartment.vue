<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false">
    <q-card class="department-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Create Department</div>
        <q-space />
        <q-btn flat round dense icon="close" :disable="store.isSaving" @click="closeDialog" />
      </q-card-section>

      <DepartmentForm
        v-model="form"
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
import { useDepartmentStore, type DepartmentPayload } from '@hr/stores/department-store';
import DepartmentForm from './DepartmentForm.vue';

const store = useDepartmentStore();
const $q = useQuasar();
const form = ref<DepartmentPayload>(emptyForm());

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value: boolean) => {
    if (!value) {
      closeDialog();
    } else {
      store.isCreateOpen = value;
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

function closeDialog() {
  store.closeCreateDialog();
  form.value = emptyForm();
}

async function saveDepartment() {
  const result = await store.createDepartment({
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
  () => store.isCreateOpen,
  (isOpen) => {
    if (isOpen) {
      form.value = emptyForm();
    }
  },
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
