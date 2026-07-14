<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false" @hide="resetForm">
    <q-card class="department-editor-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn flat round dense icon="close" :disable="departmentStore.isSaving" @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="submitForm">
          <q-input
            v-model="form.name"
            label="Department name"
            outlined
            autofocus
            :disable="departmentStore.isSaving"
            :rules="[(value) => !!String(value ?? '').trim() || 'Department name is required']"
          />

          <q-select
            v-model="form.parentId"
            clearable
            emit-value
            map-options
            label="Parent department"
            stack-label
            :disable="departmentStore.isSaving"
            :options="parentOptions"
          />

          <q-select
            v-model="form.timesheet_template_id"
            clearable
            emit-value
            map-options
            label="Timesheet template"
            stack-label
            hint="Leave empty to assign the default template."
            :disable="departmentStore.isSaving"
            :options="timesheetTemplateOptions"
          />

          <q-input
            v-model.number="form.totalDailyHoursBeforeOvertime"
            type="number"
            step="0.25"
            min="0"
            max="24"
            label="Total daily hours before overtime"
            outlined
            :disable="departmentStore.isSaving"
          />

          <q-input
            v-model.number="form.totalWeeklyHoursBeforeOvertime"
            type="number"
            step="0.25"
            min="0"
            max="168"
            label="Total weekly hours before overtime"
            outlined
            :disable="departmentStore.isSaving"
          />

          <q-select
            v-model="form.overtimeThresholdMode"
            emit-value
            map-options
            label="Overtime threshold mode"
            hint="Choose whether overtime uses the daily or weekly hour limit."
            outlined
            :disable="departmentStore.isSaving"
            :options="[
              { label: 'Daily then weekly hours before overtime', value: 'DAILY_AND_WEEKLY' },
              { label: 'Daily hours before overtime only', value: 'DAILY' },
              { label: 'Weekly hours before overtime only', value: 'WEEKLY' },
            ]"
          />

          <q-select
            v-model="form.overnightShiftMode"
            emit-value
            map-options
            label="Overnight shift handling"
            hint="Controls whether overnight work is split at midnight for daily overtime and holiday pay."
            outlined
            :disable="departmentStore.isSaving"
            :options="[
              { label: 'Split at midnight (separate rows per day)', value: 'SPLIT_AT_MIDNIGHT' },
              { label: 'Keep on clock-in day (holiday/OT use start day)', value: 'ATTRIBUTE_TO_CLOCK_IN_DAY' },
              { label: 'Keep on clock-out day (holiday/OT use end day)', value: 'ATTRIBUTE_TO_CLOCK_OUT_DAY' },
            ]"
          />

          <IncludeLunchHourFields
            :include-lunch-hour="form.includeLunchHour ?? true"
            :lunch-hour-hours="form.lunchHourHours ?? 1"
            :disable="departmentStore.isSaving"
            @update:include-lunch-hour="form.includeLunchHour = $event"
            @update:lunch-hour-hours="form.lunchHourHours = $event"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn flat label="Cancel" color="grey" :disable="departmentStore.isSaving" @click="closeDialog" />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="departmentStore.isSaving"
              :disable="!form.name.trim()"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useDepartmentStore, type Department, type DepartmentPayload } from '@hr/stores/department-store';
import { useTimesheetTemplateStore } from '@hr/stores/timesheet-template-store';
import IncludeLunchHourFields from '@core/components/common/IncludeLunchHourFields.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title: string;
    departmentId?: number | null;
    excludeDepartmentId?: number | null;
    initialValue?: DepartmentPayload | null;
  }>(),
  {
    departmentId: null,
    excludeDepartmentId: null,
    initialValue: null,
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'saved', department: Department): void;
}>();

const $q = useQuasar();
const departmentStore = useDepartmentStore();
const timesheetTemplateStore = useTimesheetTemplateStore();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<DepartmentPayload>(emptyForm());

const parentOptions = computed(() =>
  departmentStore.departmentOptions
    .filter((department) => department.id !== props.excludeDepartmentId)
    .map((department) => ({ label: department.name, value: department.id })),
);

const timesheetTemplateOptions = computed(() =>
  timesheetTemplateStore.timesheetTemplates.map((template) => ({
    label: template.name,
    value: template.id,
  })),
);

function emptyForm(): DepartmentPayload {
  return {
    name: '',
    parentId: null,
    timesheet_template_id: null,
    totalDailyHoursBeforeOvertime: 9,
    totalWeeklyHoursBeforeOvertime: 45,
    overtimeThresholdMode: 'DAILY_AND_WEEKLY',
    overnightShiftMode: 'SPLIT_AT_MIDNIGHT',
    includeLunchHour: true,
    lunchHourHours: 1,
  };
}

function applyInitialValue() {
  form.value = props.initialValue
    ? {
        name: props.initialValue.name ?? '',
        parentId: props.initialValue.parentId ?? null,
        timesheet_template_id: props.initialValue.timesheet_template_id ?? null,
        totalDailyHoursBeforeOvertime: props.initialValue.totalDailyHoursBeforeOvertime ?? 9,
        totalWeeklyHoursBeforeOvertime: props.initialValue.totalWeeklyHoursBeforeOvertime ?? 45,
        overtimeThresholdMode: props.initialValue.overtimeThresholdMode ?? 'DAILY_AND_WEEKLY',
        overnightShiftMode: props.initialValue.overnightShiftMode ?? 'SPLIT_AT_MIDNIGHT',
        includeLunchHour: props.initialValue.includeLunchHour ?? true,
        lunchHourHours: props.initialValue.lunchHourHours ?? 1,
      }
    : emptyForm();
}

function resetForm() {
  form.value = emptyForm();
}

function closeDialog() {
  dialogModel.value = false;
  resetForm();
}

async function loadOptions() {
  await Promise.all([
    departmentStore.fetchDepartmentOptions(),
    timesheetTemplateStore.fetchTimesheetTemplates(),
  ]);
}

async function submitForm() {
  const payload: DepartmentPayload = {
    ...form.value,
    name: form.value.name.trim(),
  };

  const result = props.departmentId
    ? await departmentStore.updateDepartment(props.departmentId, payload)
    : await departmentStore.createDepartment(payload);

  if (result) {
    $q.notify({
      type: 'positive',
      message: props.departmentId ? 'Department updated.' : 'Department saved.',
    });
    emit('saved', result);
    closeDialog();
  } else if (departmentStore.error) {
    $q.notify({ type: 'negative', message: departmentStore.error });
  }
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      applyInitialValue();
      await loadOptions();
    } else {
      resetForm();
    }
  },
);

watch(
  () => props.initialValue,
  () => {
    if (props.modelValue) {
      applyInitialValue();
    }
  },
);
</script>

<style scoped>
.department-editor-dialog-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.department-editor-dialog-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
