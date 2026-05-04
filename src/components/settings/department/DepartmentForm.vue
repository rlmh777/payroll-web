<template>
  <q-card-section>
    <q-form class="q-gutter-md" @submit.prevent="$emit('submit')">
      <q-input
        :model-value="modelValue.name"
        label="Department name"
        outlined
        autofocus
        :rules="[(value) => !!value || 'Department name is required']"
        :disable="saving"
        @update:model-value="updateField('name', String($event ?? ''))"
      />

      <ParentDepartmentSelect
        v-if="enhancedSelects"
        :model-value="modelValue.parentId ?? null"
        clearable
        label="Parent department"
        :disable="saving ?? false"
        :show-add-new="true"
        :show-edit="true"
        :exclude-department-id="excludeDepartmentId ?? null"
        @update:model-value="updateField('parentId', $event ?? null)"
      />
      <q-select
        v-else
        :model-value="modelValue.parentId"
        clearable
        emit-value
        map-options
        label="Parent department"
        stack-label
        :options="parentOptions"
        :disable="saving"
        @update:model-value="updateField('parentId', ($event as number | null) ?? null)"
      />

      <WorkTimesheetSelect
        v-if="enhancedSelects"
        :model-value="modelValue.work_timesheet_id ?? null"
        clearable
        label="Working hour timesheet"
        :disable="saving ?? false"
        :show-add-new="true"
        :show-edit="true"
        @update:model-value="updateField('work_timesheet_id', $event ?? null)"
      />
      <q-select
        v-else
        :model-value="modelValue.work_timesheet_id"
        clearable
        emit-value
        map-options
        label="Working hour timesheet"
        hint="Leave empty to assign the default timesheet."
        stack-label
        :options="workTimesheetOptions"
        :disable="saving"
        @update:model-value="updateField('work_timesheet_id', ($event as string | null) ?? null)"
      />

      <div v-if="enhancedSelects" class="text-caption text-grey-6 q-mt-n-sm">
        Leave empty to assign the default timesheet.
      </div>

      <div class="row q-gutter-sm justify-end q-mt-lg">
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="$emit('cancel')" />
        <q-btn
          color="primary"
          type="submit"
          :label="submitLabel"
          :loading="saving"
          :disable="!modelValue.name"
        />
      </div>
    </q-form>
  </q-card-section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useDepartmentStore, type DepartmentPayload } from 'src/stores/department-store';
import { useWorkTimesheetStore } from 'src/stores/work-timesheet-store';
import ParentDepartmentSelect from './ParentDepartmentSelect.vue';
import WorkTimesheetSelect from './WorkTimesheetSelect.vue';

const props = withDefaults(
  defineProps<{
    modelValue: DepartmentPayload;
    excludeDepartmentId?: number | null;
    saving?: boolean;
    submitLabel?: string;
    enhancedSelects?: boolean;
  }>(),
  {
    excludeDepartmentId: null,
    saving: false,
    submitLabel: 'Save',
    enhancedSelects: true,
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

<style scoped></style>
