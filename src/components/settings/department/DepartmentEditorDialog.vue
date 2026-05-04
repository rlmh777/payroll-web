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
            v-model="form.work_timesheet_id"
            clearable
            emit-value
            map-options
            label="Working hour timesheet"
            stack-label
            hint="Leave empty to assign the default timesheet."
            :disable="departmentStore.isSaving"
            :options="workTimesheetOptions"
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
import { useDepartmentStore, type Department, type DepartmentPayload } from 'src/stores/department-store';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';

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
const workTimesheetStore = useWorkTimesheetStore();

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

const workTimesheetOptions = computed(() =>
  workTimesheetStore.workTimesheets.map((timesheet) => ({
    label: timesheet.name,
    value: timesheet.id,
  })),
);

function emptyForm(): DepartmentPayload {
  return {
    name: '',
    parentId: null,
    work_timesheet_id: null,
  };
}

function applyInitialValue() {
  form.value = props.initialValue
    ? {
        name: props.initialValue.name ?? '',
        parentId: props.initialValue.parentId ?? null,
        work_timesheet_id: props.initialValue.work_timesheet_id ?? null,
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
    workTimesheetStore.fetchWorkTimesheets(),
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
