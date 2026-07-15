<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="employee-schedule-dialog">
      <q-card-section class="row items-center q-pb-none employee-schedule-dialog-header">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section class="employee-schedule-dialog-body">
        <q-form class="employee-schedule-form" @submit.prevent="submitForm">
          <div class="employee-schedule-field">
            <q-select
              v-model="form.employeeId"
              :options="filteredEmployeeOptions"
              option-value="id"
              :option-label="employeeOptionLabel"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              outlined
              dense
              label="Employee"
              :disable="isEditing"
              @filter="filterEmployees"
            />
          </div>

          <div class="employee-schedule-field">
            <q-select
              v-model="form.departmentId"
              :options="filteredDepartmentOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              use-input
              fill-input
              hide-selected
              input-debounce="0"
              outlined
              dense
              label="Department"
              :loading="departmentStore.isLoading"
              @filter="filterDepartments"
            />
          </div>

          <div v-if="form.employeeId" class="employee-schedule-field">
            <q-select
              v-model="form.employmentDetailId"
              :options="employmentContractOptions"
              emit-value
              map-options
              option-value="id"
              option-label="label"
              outlined
              dense
              clearable
              label="Employment contract"
              :hint="employmentContractOptions.length > 1 ? 'Required when the employee has multiple active contracts' : undefined"
              @update:model-value="applySelectedContract"
            />
          </div>

          <div v-if="!isEditing" class="employee-schedule-field">
            <div class="text-caption text-grey-7 q-mb-sm">Schedule type</div>
            <q-option-group
              v-model="form.mode"
              :options="modeOptions"
              color="primary"
              inline
              dense
            />
          </div>

          <div v-if="showSingleDatePicker" class="employee-schedule-field">
            <div class="text-caption text-grey-7 q-mb-sm">Date</div>
            <q-date v-model="form.date" mask="YYYY-MM-DD" minimal class="employee-schedule-date" />
          </div>

          <div v-if="showSeriesDatePicker" class="employee-schedule-field">
            <div class="text-caption text-grey-7 q-mb-sm">Date range</div>
            <q-date
              v-model="seriesRange"
              range
              mask="YYYY-MM-DD"
              minimal
              class="employee-schedule-date"
            />
          </div>

          <div v-if="showWeekdayPicker" class="employee-schedule-field">
            <div class="text-caption text-grey-7 q-mb-sm">Repeat on</div>
            <q-option-group
              v-model="form.days"
              :options="weekdayOptions"
              type="checkbox"
              color="primary"
              inline
              dense
            />
          </div>

          <div class="employee-schedule-field employee-schedule-time-row">
            <q-input v-model="form.startTime" label="Start time" outlined dense mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.startTime" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>

            <q-input v-model="form.endTime" label="End time" outlined dense mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.endTime" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="employee-schedule-field">
            <IncludeLunchHourFields
              v-model:include-lunch-hour="form.includeLunchHour"
              v-model:lunch-hour-hours="form.lunchHourHours"
            />
          </div>

          <div v-if="isEditing" class="employee-schedule-field">
            <div class="text-caption text-grey-7 q-mb-sm">Apply changes to</div>
            <q-option-group
              v-model="editScope"
              :options="editScopeOptions"
              color="primary"
              dense
            />
          </div>
        </q-form>
      </q-card-section>

      <q-card-actions align="between" class="employee-schedule-dialog-actions">
        <div class="row q-gutter-sm">
          <q-btn
            v-if="isEditing"
            flat
            color="negative"
            label="Delete"
            @click="emit('delete', editScope)"
          />
          <q-btn v-if="isEditing" flat color="primary" label="Copy to…" @click="emit('copy')" />
        </div>
        <div class="row q-gutter-sm">
          <q-btn flat label="Cancel" color="grey" v-close-popup />
          <q-btn color="primary" label="Save" :disable="!canSave" @click="submitForm" />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDepartmentStore, type Department } from '@hr/stores/department-store';
import type { CalendarEmployee } from '@hr/stores/calendar-store';
import {
  createDefaultScheduleForm,
  scheduleFormFromEvent,
  validateScheduleForm,
  WEEKDAY_OPTIONS,
  type EmployeeScheduleForm,
  type ScheduleEventContext,
} from '@hr/utils/employee-schedule-form';
import { getEmploymentContractOptions } from '@hr/utils/calendar-employment-utils';
import { rankFuzzyMatches } from '@core/utils/fuzzy-search';
import IncludeLunchHourFields from '@core/components/common/IncludeLunchHourFields.vue';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    title?: string;
    initialDate?: string;
    employees: CalendarEmployee[];
    defaultEmployeeId?: string | null;
    editingEvent?: ScheduleEventContext | null;
  }>(),
  {
    title: 'Schedule work',
    initialDate: '',
    defaultEmployeeId: null,
    editingEvent: null,
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'save', payload: { form: EmployeeScheduleForm; scope: 'single' | 'series' }): void;
  (event: 'delete', scope: 'single' | 'series'): void;
  (event: 'copy'): void;
}>();

const departmentStore = useDepartmentStore();
const form = ref<EmployeeScheduleForm>(createDefaultScheduleForm(props.initialDate));
const editScope = ref<'single' | 'series'>('single');

type EmployeeOption = {
  id: string;
  firstName: string;
  lastName: string;
  code?: string;
  employmentDetails?: CalendarEmployee['employmentDetails'];
  employeeCompensations?: CalendarEmployee['employeeCompensations'];
};

const filteredEmployeeOptions = ref<EmployeeOption[]>([]);
const filteredDepartmentOptions = ref<Department[]>([]);

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const isEditing = computed(() => Boolean(props.editingEvent?.scheduleId));
const editingSeries = computed(() => Boolean(props.editingEvent?.seriesId));

const showSingleDatePicker = computed(() => {
  if (isEditing.value) {
    return editScope.value === 'single';
  }

  return form.value.mode === 'single';
});

const showSeriesDatePicker = computed(() => {
  if (isEditing.value) {
    return editingSeries.value && editScope.value === 'series';
  }

  return form.value.mode === 'series';
});

const showWeekdayPicker = computed(() => showSeriesDatePicker.value);

const selectedEmployee = computed(() =>
  props.employees.find((employee) => employee.id === form.value.employeeId) ?? null,
);

const employmentContractOptions = computed(() =>
  getEmploymentContractOptions(
    selectedEmployee.value,
    form.value.date || form.value.startDate || props.initialDate,
    form.value.departmentId,
  ),
);

const seriesRange = computed({
  get: () => ({
    from: form.value.startDate,
    to: form.value.endDate,
  }),
  set: (value: string | { from: string; to: string }) => {
    if (typeof value === 'string') {
      form.value.startDate = value;
      form.value.endDate = value;
      return;
    }

    form.value.startDate = value.from;
    form.value.endDate = value.to;
  },
});

const modeOptions = [
  { label: 'Single day', value: 'single' },
  { label: 'Series', value: 'series' },
];

const weekdayOptions = WEEKDAY_OPTIONS.map((day) => ({ label: day.label, value: day.value }));

const editScopeOptions = computed(() => {
  if (editingSeries.value) {
    return [
      { label: 'This event only', value: 'single' },
      { label: 'Entire series', value: 'series' },
    ];
  }

  return [{ label: 'This event', value: 'single' }];
});

const employeeOptionLabel = (employee: EmployeeOption) => {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return employee.code ? `${name} · ${employee.code}` : name;
};

function resetSelectOptions() {
  filteredEmployeeOptions.value = [...props.employees];
  filteredDepartmentOptions.value = [...departmentStore.departmentOptions];
}

function filterEmployees(val: string, update: (callback: () => void) => void) {
  update(() => {
    filteredEmployeeOptions.value = rankFuzzyMatches(
      props.employees,
      val,
      (employee) => [
        employee.firstName,
        employee.lastName,
        employee.code,
        `${employee.firstName} ${employee.lastName}`.trim(),
      ],
    );
  });
}

function filterDepartments(val: string, update: (callback: () => void) => void) {
  update(() => {
    const search = val.trim().toLowerCase();
    filteredDepartmentOptions.value = departmentStore.departmentOptions.filter(
      (department) => !search || department.name.toLowerCase().includes(search),
    );
  });
}

const canSave = computed(() => !validateScheduleForm(form.value));

function resetForm() {
  form.value = createDefaultScheduleForm(props.initialDate);
  editScope.value = 'single';
}

function applyEditingEvent() {
  if (props.editingEvent) {
    form.value = scheduleFormFromEvent(props.editingEvent);
    editScope.value = 'single';
    return;
  }

  form.value = createDefaultScheduleForm(props.initialDate);
  form.value.employeeId = props.defaultEmployeeId ?? null;
  editScope.value = 'single';
  defaultEmploymentContract();
}

function applySelectedContract() {
  const selected = employmentContractOptions.value.find((option) => option.id === form.value.employmentDetailId);
  if (!selected) {
    return;
  }

  if (selected.departmentId != null) {
    form.value.departmentId = selected.departmentId;
  }

}

function defaultEmploymentContract() {
  const options = employmentContractOptions.value;
  if (options.length === 1) {
    form.value.employmentDetailId = options[0]?.id ?? null;
    applySelectedContract();
  }
}

function submitForm() {
  const error = validateScheduleForm(form.value);
  if (error) return;

  emit('save', {
    form: { ...form.value, days: [...form.value.days] },
    scope: isEditing.value ? editScope.value : 'single',
  });
}

watch(
  () => props.modelValue,
  async (isOpen) => {
    if (isOpen) {
      applyEditingEvent();
      if (!departmentStore.departmentOptions.length) {
        await departmentStore.fetchDepartmentOptions();
      }
      resetSelectOptions();
    } else {
      resetForm();
    }
  },
);

watch(
  () => props.employees,
  () => {
    if (props.modelValue) {
      resetSelectOptions();
    }
  },
);

watch(
  () => [form.value.employeeId, form.value.departmentId, form.value.date, form.value.startDate] as const,
  () => {
    if (!form.value.employmentDetailId) {
      defaultEmploymentContract();
    }
  },
);

watch(
  () => props.editingEvent,
  () => {
    if (props.modelValue) {
      applyEditingEvent();
    }
  },
);
</script>

<style scoped>
.employee-schedule-dialog {
  width: min(520px, 95vw);
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.employee-schedule-dialog-header {
  padding: 24px 24px 0;
}

.employee-schedule-dialog-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.employee-schedule-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.employee-schedule-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.employee-schedule-time-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.employee-schedule-date {
  width: 100%;
  max-width: 100%;
  border-radius: 12px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

.employee-schedule-dialog-actions {
  padding: 0 24px 24px;
}
</style>
