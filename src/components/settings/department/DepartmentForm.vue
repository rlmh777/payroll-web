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

      <TimesheetTemplateSelect
        v-if="enhancedSelects"
        :model-value="modelValue.timesheet_template_id ?? null"
        clearable
        label="Timesheet template"
        :disable="saving ?? false"
        :show-add-new="true"
        :show-edit="true"
        :default-department-id="excludeDepartmentId ?? null"
        @update:model-value="updateField('timesheet_template_id', $event ?? null)"
      />
      <q-select
        v-else
        :model-value="modelValue.timesheet_template_id"
        clearable
        emit-value
        map-options
        label="Timesheet template"
        hint="Leave empty to assign the default template."
        stack-label
        :options="timesheetTemplateOptions"
        :disable="saving"
        @update:model-value="updateField('timesheet_template_id', ($event as string | null) ?? null)"
      />

      <div v-if="enhancedSelects" class="text-caption text-grey-6 q-mt-n-sm">
        Leave empty to assign the default template.
      </div>

      <q-input
        :model-value="modelValue.totalDailyHoursBeforeOvertime"
        type="number"
        step="0.25"
        min="0"
        max="24"
        label="Total daily hours before overtime"
        hint="Regular hours allowed per day before overtime applies."
        outlined
        :disable="saving"
        @update:model-value="updateHoursField('totalDailyHoursBeforeOvertime', $event)"
      />

      <q-input
        :model-value="modelValue.totalWeeklyHoursBeforeOvertime"
        type="number"
        step="0.25"
        min="0"
        max="168"
        label="Total weekly hours before overtime"
        hint="Regular hours allowed per week before overtime applies."
        outlined
        :disable="saving"
        @update:model-value="updateHoursField('totalWeeklyHoursBeforeOvertime', $event)"
      />

      <q-select
        :model-value="modelValue.overtimeThresholdMode ?? 'DAILY_AND_WEEKLY'"
        emit-value
        map-options
        label="Overtime threshold mode"
        hint="Choose whether overtime is calculated using the daily or weekly hour limit."
        outlined
        :options="[...OVERTIME_THRESHOLD_OPTIONS]"
        :disable="saving"
        @update:model-value="updateField('overtimeThresholdMode', ($event as 'DAILY' | 'WEEKLY' | 'DAILY_AND_WEEKLY') ?? 'DAILY_AND_WEEKLY')"
      />

      <q-select
        :model-value="modelValue.overnightShiftMode ?? 'SPLIT_AT_MIDNIGHT'"
        emit-value
        map-options
        label="Overnight shift handling"
        hint="Controls whether overnight work is split at midnight for daily overtime and holiday pay."
        outlined
        :options="[...OVERNIGHT_SHIFT_MODE_OPTIONS]"
        :disable="saving"
        @update:model-value="updateField('overnightShiftMode', ($event as DepartmentPayload['overnightShiftMode']) ?? 'SPLIT_AT_MIDNIGHT')"
      />

      <IncludeLunchHourFields
        :include-lunch-hour="modelValue.includeLunchHour ?? true"
        :lunch-hour-hours="modelValue.lunchHourHours ?? 1"
        :disable="saving ?? false"
        @update:include-lunch-hour="updateField('includeLunchHour', $event)"
        @update:lunch-hour-hours="updateField('lunchHourHours', $event)"
      />

      <AccountSelect
        :model-value="modelValue.accountId ?? null"
        label="Wages expense account"
        hint="Sub-account used for this department's wage costs in journal entries."
        clearable
        :disable="saving ?? false"
        show-add-new
        show-edit
        @update:model-value="updateField('accountId', $event ?? null)"
      />

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
import { useTimesheetTemplateStore } from 'src/stores/timesheet-template-store';
import ParentDepartmentSelect from './ParentDepartmentSelect.vue';
import TimesheetTemplateSelect from './TimesheetTemplateSelect.vue';
import IncludeLunchHourFields from 'src/components/common/IncludeLunchHourFields.vue';
import AccountSelect from 'src/components/employee/common/AccountSelect.vue';

const OVERTIME_THRESHOLD_OPTIONS = [
  { label: 'Daily then weekly hours before overtime', value: 'DAILY_AND_WEEKLY' },
  { label: 'Daily hours before overtime only', value: 'DAILY' },
  { label: 'Weekly hours before overtime only', value: 'WEEKLY' },
] as const;

const OVERNIGHT_SHIFT_MODE_OPTIONS = [
  {
    label: 'Split at midnight (separate rows per day)',
    value: 'SPLIT_AT_MIDNIGHT',
  },
  {
    label: 'Keep on clock-in day (holiday/OT use start day)',
    value: 'ATTRIBUTE_TO_CLOCK_IN_DAY',
  },
  {
    label: 'Keep on clock-out day (holiday/OT use end day)',
    value: 'ATTRIBUTE_TO_CLOCK_OUT_DAY',
  },
] as const;

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
const timesheetTemplateStore = useTimesheetTemplateStore();

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

function updateField<Key extends keyof DepartmentPayload>(key: Key, value: DepartmentPayload[Key]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}

function updateHoursField(
  key: 'totalDailyHoursBeforeOvertime' | 'totalWeeklyHoursBeforeOvertime',
  value: string | number | null,
) {
  if (value === '' || value === null) {
    updateField(
      key,
      key === 'totalDailyHoursBeforeOvertime' ? 9 : 45,
    );
    return;
  }

  const parsed = Number(value);
  updateField(key, Number.isFinite(parsed) ? parsed : key === 'totalDailyHoursBeforeOvertime' ? 9 : 45);
}
</script>

<style scoped></style>
