<template>
  <q-form class="department-form" @submit.prevent="$emit('submit')">
    <q-card-section class="dialog-body">
      <q-input
        :model-value="modelValue.name"
        label="Department name"
        class="department-name-field"
        outlined
        autofocus
        :rules="[(value) => !!value || 'Department name is required']"
        @update:model-value="updateField('name', String($event ?? ''))"
      />

      <q-select
        :model-value="modelValue.parentId"
        clearable
        emit-value
        map-options
        label="Parent department"
        stack-label
        :options="parentOptions"
        @update:model-value="updateField('parentId', ($event as number | null) ?? null)"
      />

      <q-select
        :model-value="modelValue.work_timesheet_id"
        clearable
        emit-value
        map-options
        label="Working hour timesheet"
        hint="Leave empty to assign the default timesheet."
        stack-label
        :options="workTimesheetOptions"
        @update:model-value="updateField('work_timesheet_id', ($event as string | null) ?? null)"
      />
    </q-card-section>

    <q-card-actions align="right" class="department-dialog-actions">
      <q-btn flat label="Cancel" class="text-grey-7" :disable="saving" @click="$emit('cancel')" />
      <q-btn
        color="primary"
        type="submit"
        :label="submitLabel"
        :loading="saving"
        :disable="!modelValue.name"
      />
    </q-card-actions>
  </q-form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDepartmentStore, type DepartmentPayload } from 'src/stores/department-store';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';

const props = withDefaults(
  defineProps<{
    modelValue: DepartmentPayload;
    excludeDepartmentId?: number | null;
    saving?: boolean;
    submitLabel?: string;
  }>(),
  {
    excludeDepartmentId: null,
    saving: false,
    submitLabel: 'Save',
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: DepartmentPayload): void;
  (event: 'submit'): void;
  (event: 'cancel'): void;
}>();

const departmentStore = useDepartmentStore();
const workTimesheetStore = useWorkTimesheetStore();

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

function updateField<Key extends keyof DepartmentPayload>(key: Key, value: DepartmentPayload[Key]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}
</script>

<style scoped>
.department-dialog-actions {
  padding: 10px 32px 32px;
}

.dialog-body {
  padding: 32px 32px 20px;
}

.dialog-body :deep(.q-field) {
  margin-bottom: 34px;
}

.dialog-body :deep(.department-name-field.q-field) {
  margin-bottom: 54px;
}
</style>
