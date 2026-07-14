<template>
  <div class="calendar-event-form q-gutter-md">
    <div v-if="showKindPicker">
      <div class="text-caption text-grey-7 q-mb-xs">Type</div>
      <q-option-group
        :model-value="kind"
        :options="kindOptions"
        color="primary"
        inline
        dense
        :disable="props.disable"
        @update:model-value="emit('update:kind', $event)"
      />
    </div>

    <q-select
      v-if="kind === 'event'"
      :model-value="eventSubtype"
      :options="eventSubtypeOptions"
      label="Event"
      outlined
      dense
      emit-value
      map-options
      :disable="props.disable"
      @update:model-value="emit('update:eventSubtype', $event)"
    />

    <q-select
      v-if="showEmployeeField"
      :model-value="employeeId"
      :options="employees"
      label="Employee"
      outlined
      dense
      clearable
      emit-value
      map-options
      option-value="id"
      :option-label="employeeOptionLabel"
      :disable="props.disable"
      :hint="kind === 'work' ? 'Required for work events' : 'Optional — assigns to this employee\'s calendar'"
      @update:model-value="handleEmployeeChange"
    />

    <q-select
      v-if="kind === 'work' && employeeId"
      :model-value="employmentDetailId"
      :options="employmentContractOptions"
      label="Employment contract"
      outlined
      dense
      clearable
      emit-value
      map-options
      :disable="props.disable"
      :hint="employmentContractOptions.length > 1 ? 'Required when the employee has multiple active contracts' : undefined"
      @update:model-value="handleEmploymentContractChange"
    />

    <DepartmentSelect
      :model-value="departmentId"
      label="Department"
      :disable="props.disable"
      @update:model-value="emit('update:departmentId', $event)"
    />

    <WorksiteSelect
      v-if="kind === 'work'"
      :model-value="worksiteId"
      label="Worksite"
      :disable="props.disable"
      @update:model-value="emit('update:worksiteId', $event)"
    />

    <IncludeLunchHourFields
      :include-lunch-hour="includeLunchHour"
      :lunch-hour-hours="lunchHourHours ?? 1"
      :disable="props.disable ?? false"
      @update:include-lunch-hour="emit('update:includeLunchHour', $event)"
      @update:lunch-hour-hours="emit('update:lunchHourHours', $event)"
    />

    <q-input
      :model-value="description"
      label="Description"
      outlined
      dense
      :disable="props.disable"
      @update:model-value="emit('update:description', String($event ?? ''))"
    />

    <div v-if="isSeries" class="calendar-event-form-field">
      <q-input
        :model-value="dateRangeLabel"
        label="Date range"
        outlined
        dense
        readonly
        :disable="props.disable"
      >
        <template #append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                :model-value="dateRangeModel"
                range
                mask="YYYY-MM-DD"
                @update:model-value="handleDateRangeChange"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <div class="calendar-event-form-row">
      <q-input
        v-if="!isSeries"
        :model-value="formatCalendarDisplayDate(startDate)"
        label="Start date"
        outlined
        dense
        readonly
        :disable="props.disable"
      >
        <template #append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                :model-value="startDate"
                mask="YYYY-MM-DD"
                @update:model-value="emit('update:startDate', String($event ?? ''))"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <q-input
        :model-value="startTime"
        label="Start time"
        outlined
        dense
        mask="##:##"
        :disable="props.disable"
        @update:model-value="emit('update:startTime', normalizeCalendarTimeInput(String($event ?? '')))"
      >
        <template #append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time
                :model-value="startTime"
                format24h
                @update:model-value="emit('update:startTime', normalizeCalendarTimeInput(String($event ?? '')))"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>

    <div class="calendar-event-form-row">
      <q-input
        v-if="!isSeries"
        :model-value="formatCalendarDisplayDate(endDate)"
        label="End date"
        outlined
        dense
        readonly
        :disable="props.disable"
      >
        <template #append>
          <q-icon name="event" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-date
                :model-value="endDate"
                mask="YYYY-MM-DD"
                @update:model-value="emit('update:endDate', String($event ?? ''))"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>

      <q-input
        :model-value="endTime"
        label="End time"
        outlined
        dense
        mask="##:##"
        :disable="props.disable"
        @update:model-value="emit('update:endTime', normalizeCalendarTimeInput(String($event ?? '')))"
      >
        <template #append>
          <q-icon name="access_time" class="cursor-pointer">
            <q-popup-proxy cover transition-show="scale" transition-hide="scale">
              <q-time
                :model-value="endTime"
                format24h
                @update:model-value="emit('update:endTime', normalizeCalendarTimeInput(String($event ?? '')))"
              />
            </q-popup-proxy>
          </q-icon>
        </template>
      </q-input>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import WorksiteSelect from '@hr/components/worksite/WorksiteSelect.vue';
import IncludeLunchHourFields from '@core/components/common/IncludeLunchHourFields.vue';
import type { CalendarEventSubtype, CalendarKind } from './calendarTypes';
import type { CalendarEmployee } from '@hr/stores/calendar-store';
import {
  getActiveEmploymentDetail,
  getEmploymentContractOptions,
} from '@hr/utils/calendar-employment-utils';
import { formatCalendarDisplayDate, normalizeCalendarTimeInput } from '@hr/utils/calendar-event-utils';

const props = withDefaults(
  defineProps<{
    kind: CalendarKind;
    eventSubtype: CalendarEventSubtype;
    description: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    departmentId: number | null;
    employeeId: string | null;
    employmentDetailId?: string | null;
    worksiteId: number | null;
    includeLunchHour: boolean;
    lunchHourHours?: number | null;
    employees?: CalendarEmployee[];
    showEmployeePicker?: boolean;
    showKindPicker?: boolean;
    isSeries?: boolean;
    disable?: boolean;
  }>(),
  {
    employees: () => [],
    showEmployeePicker: true,
    showKindPicker: true,
    isSeries: false,
    disable: false,
    lunchHourHours: 1,
  },
);

const emit = defineEmits<{
  (event: 'update:kind', value: CalendarKind): void;
  (event: 'update:eventSubtype', value: CalendarEventSubtype): void;
  (event: 'update:description', value: string): void;
  (event: 'update:startDate', value: string): void;
  (event: 'update:endDate', value: string): void;
  (event: 'update:startTime', value: string): void;
  (event: 'update:endTime', value: string): void;
  (event: 'update:departmentId', value: number | null): void;
  (event: 'update:employeeId', value: string | null): void;
  (event: 'update:employmentDetailId', value: string | null): void;
  (event: 'update:worksiteId', value: number | null): void;
  (event: 'update:includeLunchHour', value: boolean): void;
  (event: 'update:lunchHourHours', value: number): void;
}>();

const kindOptions = [
  { label: 'Work', value: 'work' as const },
  { label: 'Event', value: 'event' as const },
];

const eventSubtypeOptions = [
  { label: 'Birthday', value: 'birthday' as const },
  { label: 'Holiday', value: 'holiday' as const },
];

const showEmployeeField = computed(() => props.showEmployeePicker || props.kind === 'work');

const selectedEmployee = computed(() =>
  props.employees.find((entry) => entry.id === props.employeeId) ?? null,
);

const employmentContractOptions = computed(() =>
  getEmploymentContractOptions(
    selectedEmployee.value,
    props.startDate,
    props.departmentId,
  ),
);

const dateRangeModel = computed(() => {
  if (!props.startDate) {
    return null;
  }

  if (!props.endDate || props.startDate === props.endDate) {
    return props.startDate;
  }

  return { from: props.startDate, to: props.endDate };
});

const dateRangeLabel = computed(() => {
  if (!props.startDate) {
    return '';
  }

  if (!props.endDate || props.startDate === props.endDate) {
    return formatCalendarDisplayDate(props.startDate);
  }

  return `${formatCalendarDisplayDate(props.startDate)} – ${formatCalendarDisplayDate(props.endDate)}`;
});

function handleDateRangeChange(value: string | { from: string; to: string } | null) {
  if (!value) {
    return;
  }

  if (typeof value === 'string') {
    emit('update:startDate', value);
    emit('update:endDate', value);
    return;
  }

  emit('update:startDate', value.from);
  emit('update:endDate', value.to);
}

function handleEmployeeChange(employeeId: string | null) {
  emit('update:employeeId', employeeId);
  emit('update:employmentDetailId', null);

  if (!employeeId) {
    return;
  }

  const employee = props.employees.find((entry) => entry.id === employeeId);
  const contractOptions = getEmploymentContractOptions(employee, props.startDate, props.departmentId);
  if (contractOptions.length === 1) {
    handleEmploymentContractChange(contractOptions[0]?.id ?? null);
    return;
  }

  const activeEmployment = getActiveEmploymentDetail(employee);
  if (!activeEmployment) {
    return;
  }

  if (activeEmployment.departmentId != null) {
    emit('update:departmentId', activeEmployment.departmentId);
  }

  if (props.kind === 'work' && activeEmployment.worksiteId != null) {
    emit('update:worksiteId', activeEmployment.worksiteId);
  }
}

function handleEmploymentContractChange(contractId: string | null) {
  emit('update:employmentDetailId', contractId);

  const option = employmentContractOptions.value.find((entry) => entry.id === contractId);
  if (!option) {
    return;
  }

  if (option.departmentId != null) {
    emit('update:departmentId', option.departmentId);
  }

  if (option.worksiteId != null) {
    emit('update:worksiteId', option.worksiteId);
  }
}

const employeeOptionLabel = (employee: { firstName: string; lastName: string; code?: string }) => {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return employee.code ? `${name} · ${employee.code}` : name;
};
</script>

<style scoped>
.calendar-event-form-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 160px;
  gap: 16px;
  align-items: start;
}

@media (max-width: 600px) {
  .calendar-event-form-row {
    grid-template-columns: 1fr;
  }
}
</style>
