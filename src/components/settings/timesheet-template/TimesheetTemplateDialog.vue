<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="timesheet-template-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="submitForm">
          <q-input v-model="form.name" label="Template name" outlined dense />

          <div>
            <div class="text-subtitle2 q-mb-xs">Daily schedule</div>
            <div class="text-caption text-grey-7 q-mb-sm">
              Add one or more time slots per day. Each slot must be assigned to a department so
              employees are matched using their active employment detail.
            </div>

            <div v-for="group in form.dayGroups" :key="group.day" class="day-group q-mb-md">
              <div class="row items-center justify-between q-mb-sm">
                <div class="row items-center q-gutter-sm">
                  <q-toggle
                    v-model="group.enabled"
                    dense
                    :label="group.day"
                    @update:model-value="(enabled) => onDayToggle(group, Boolean(enabled))"
                  />
                </div>
                <q-btn
                  v-if="group.enabled"
                  flat
                  dense
                  no-caps
                  color="primary"
                  icon="add"
                  label="Add slot"
                  @click="addSlot(group)"
                />
              </div>

              <div v-if="group.enabled" class="day-schedule-table-wrapper">
                <q-markup-table flat bordered dense class="day-schedule-table">
                  <thead>
                    <tr>
                      <th class="text-left">Start</th>
                      <th class="text-left">End</th>
                      <th class="text-left">Department</th>
                      <th class="text-left">Lunch</th>
                      <th class="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="slot in group.slots" :key="slot.id">
                      <td>
                        <q-input
                          v-model="slot.startTime"
                          dense
                          outlined
                          mask="##:##"
                          hide-bottom-space
                        >
                          <template #append>
                            <q-icon name="access_time" class="cursor-pointer">
                              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-time v-model="slot.startTime" format24h />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                      </td>
                      <td>
                        <q-input
                          v-model="slot.endTime"
                          dense
                          outlined
                          mask="##:##"
                          hide-bottom-space
                        >
                          <template #append>
                            <q-icon name="access_time" class="cursor-pointer">
                              <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                                <q-time v-model="slot.endTime" format24h />
                              </q-popup-proxy>
                            </q-icon>
                          </template>
                        </q-input>
                      </td>
                      <td>
                        <q-select
                          v-model="slot.departmentId"
                          :options="departmentStore.departmentOptions"
                          option-value="id"
                          option-label="name"
                          emit-value
                          map-options
                          dense
                          outlined
                          hide-bottom-space
                          hide-hint
                          label="Department"
                          :loading="departmentStore.isLoading"
                          :rules="[(value) => !!value || 'Department is required']"
                        />
                      </td>
                      <td class="lunch-cell">
                        <q-toggle v-model="slot.includeLunchHour" dense label="Included" />
                        <q-input
                          v-if="slot.includeLunchHour"
                          v-model.number="slot.lunchHourHours"
                          type="number"
                          step="0.25"
                          min="0"
                          max="8"
                          dense
                          outlined
                          hide-bottom-space
                          label="Hours"
                          class="q-mt-xs"
                        />
                      </td>
                      <td class="text-right">
                        <q-btn
                          flat
                          round
                          dense
                          icon="delete"
                          color="negative"
                          :disable="group.slots.length === 1"
                          @click="removeSlot(group, slot.id)"
                        >
                          <q-tooltip>Remove slot</q-tooltip>
                        </q-btn>
                      </td>
                    </tr>
                  </tbody>
                </q-markup-table>
              </div>
            </div>
          </div>

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn flat label="Cancel" color="grey" @click="closeDialog" />
            <q-btn type="submit" color="primary" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDepartmentStore } from 'src/stores/department-store';
import {
  createDefaultDayGroups,
  createSlot,
  type TimesheetTemplateDayGroup,
  type TimesheetTemplateForm,
} from 'src/utils/timesheet-template-utils';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    initialValue?: TimesheetTemplateForm | null;
    title?: string;
    defaultDepartmentId?: number | null;
  }>(),
  {
    initialValue: null,
    title: 'Add a Timesheet Template',
    defaultDepartmentId: null,
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'save', payload: TimesheetTemplateForm): void;
}>();

const departmentStore = useDepartmentStore();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<TimesheetTemplateForm>({
  name: '',
  dayGroups: createDefaultDayGroups(props.defaultDepartmentId),
});

function defaultDayGroups() {
  return createDefaultDayGroups(props.defaultDepartmentId);
}

function defaultSlot() {
  return createSlot({ departmentId: props.defaultDepartmentId ?? null });
}

function cloneForm(value: TimesheetTemplateForm): TimesheetTemplateForm {
  return {
    name: value.name,
    dayGroups: value.dayGroups.map((group) => ({
      ...group,
      slots: group.slots.map((slot) => ({ ...slot })),
    })),
  };
}

function applyInitialValue() {
  form.value = props.initialValue ? cloneForm(props.initialValue) : {
    name: '',
    dayGroups: defaultDayGroups(),
  };
}

function resetForm() {
  form.value = {
    name: '',
    dayGroups: defaultDayGroups(),
  };
}

function closeDialog() {
  dialogModel.value = false;
  resetForm();
}

function addSlot(group: TimesheetTemplateDayGroup) {
  group.slots.push(defaultSlot());
}

function onDayToggle(group: TimesheetTemplateDayGroup, enabled: boolean) {
  if (enabled && group.slots.length === 0) {
    group.slots.push(defaultSlot());
    return;
  }

  if (!enabled) {
    group.slots = [];
  }
}

function removeSlot(group: TimesheetTemplateDayGroup, slotId: string) {
  if (group.slots.length === 1) {
    return;
  }

  group.slots = group.slots.filter((slot) => slot.id !== slotId);
}

function submitForm() {
  emit('save', cloneForm(form.value));
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      applyInitialValue();
      if (!departmentStore.departmentOptions.length) {
        await departmentStore.fetchDepartmentOptions();
      }
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
.timesheet-template-dialog-card {
  width: min(960px, 95vw);
  max-width: 95vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.timesheet-template-dialog-card :deep(.q-card__section) {
  overflow-y: auto;
  overflow-x: hidden;
  min-width: 0;
}

.day-group {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  min-width: 0;
}

.day-schedule-table-wrapper {
  min-width: 0;
  overflow-x: hidden;
}

.day-schedule-table {
  table-layout: fixed;
  width: 100%;
  min-width: 0;
}

.day-schedule-table :deep(th),
.day-schedule-table :deep(td) {
  overflow: hidden;
  vertical-align: middle;
}

.day-schedule-table :deep(th:nth-child(1)),
.day-schedule-table :deep(td:nth-child(1)),
.day-schedule-table :deep(th:nth-child(2)),
.day-schedule-table :deep(td:nth-child(2)) {
  width: 14%;
}

.day-schedule-table :deep(th:nth-child(3)),
.day-schedule-table :deep(td:nth-child(3)) {
  width: 44%;
}

.day-schedule-table :deep(th:nth-child(4)),
.day-schedule-table :deep(td:nth-child(4)) {
  width: 18%;
}

.day-schedule-table :deep(th:nth-child(5)),
.day-schedule-table :deep(td:nth-child(5)) {
  width: 10%;
}

.day-schedule-table :deep(.q-field) {
  width: 100%;
  min-width: 0;
}

.day-schedule-table :deep(.q-field__control),
.day-schedule-table :deep(.q-field__native),
.day-schedule-table :deep(.q-field__marginal) {
  min-width: 0;
}
</style>
