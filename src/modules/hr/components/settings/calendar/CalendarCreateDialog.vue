<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="emit('close')">
    <q-card class="calendar-create-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ dialogTitle }}</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup :disable="calendarStore.isLoading" />
      </q-card-section>

      <q-card-section>
        <div class="q-gutter-md">
          <CalendarEventFormFields
            v-model:kind="form.kind"
            v-model:event-subtype="form.eventSubtype"
            v-model:description="form.description"
            v-model:start-date="form.startDate"
            v-model:end-date="form.endDate"
            v-model:start-time="form.startTime"
            v-model:end-time="form.endTime"
            v-model:department-id="form.departmentId"
            v-model:employee-id="form.employeeId"
            v-model:employment-detail-id="form.employmentDetailId"
            v-model:worksite-id="form.worksiteId"
            v-model:include-lunch-hour="form.includeLunchHour"
            v-model:lunch-hour-hours="form.lunchHourHours"
            :employees="employees ?? []"
            :show-employee-picker="showEmployeePicker ?? true"
            :show-kind-picker="!workOnly"
            :is-series="isSeries"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              :disable="calendarStore.isLoading"
              v-close-popup
            />
            <q-btn
              color="primary"
              :label="saveLabel"
              :loading="calendarStore.isLoading"
              @click="save"
            />
          </div>
        </div>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import CalendarEventFormFields from './CalendarEventFormFields.vue';
import {
  type CalendarEventSubtype,
  type CalendarKind,
} from './calendarTypes';
import { useCalendarStore, type CalendarEmployee } from '@hr/stores/calendar-store';
import {
  getActiveEmploymentDetail,
  getEmploymentContractOptions,
} from '@hr/utils/calendar-employment-utils';
import { formatCalendarDisplayDate, normalizeDateRange } from '@hr/utils/calendar-event-utils';

const props = defineProps<{
  modelValue: boolean;
  startDate: string;
  endDate: string;
  holidaysGroupId?: string | null;
  birthdaysGroupId?: string | null;
  generalGroupId?: string | null;
  defaultEmployeeId?: string | null;
  employees?: CalendarEmployee[];
  showEmployeePicker?: boolean;
  workOnly?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'close'): void;
  (event: 'saved'): void;
}>();

const $q = useQuasar();
const calendarStore = useCalendarStore();

const form = ref({
  kind: 'work' as CalendarKind,
  eventSubtype: 'holiday' as CalendarEventSubtype,
  description: '',
  startDate: '',
  endDate: '',
  startTime: '09:00',
  endTime: '17:00',
  departmentId: null as number | null,
  employeeId: null as string | null,
  employmentDetailId: null as string | null,
  worksiteId: null as number | null,
  includeLunchHour: false,
  lunchHourHours: 1,
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const normalizedRange = computed(() =>
  normalizeDateRange(props.startDate, props.endDate),
);

const isSeries = computed(
  () => normalizedRange.value.start !== normalizedRange.value.end,
);

const dialogTitle = computed(() =>
  isSeries.value
    ? props.workOnly
      ? 'Create shift series'
      : 'Create event series'
    : props.workOnly
      ? 'Create shift'
      : 'Create event',
);

const saveLabel = computed(() => dialogTitle.value);

function applyEmploymentDefaults(employeeId: string | null) {
  if (!employeeId) {
    return;
  }

  const employee = (props.employees ?? []).find((entry) => entry.id === employeeId);
  const contractOptions = getEmploymentContractOptions(employee, form.value.startDate, form.value.departmentId);
  if (contractOptions.length === 1) {
    form.value.employmentDetailId = contractOptions[0]?.id ?? null;
  }

  const activeEmployment = getActiveEmploymentDetail(employee);
  if (!activeEmployment) {
    return;
  }

  if (activeEmployment.departmentId != null) {
    form.value.departmentId = activeEmployment.departmentId;
  }

  if (form.value.kind === 'work' && activeEmployment.worksiteId != null) {
    form.value.worksiteId = activeEmployment.worksiteId;
  }
}

function resetForm() {
  const { start, end } = normalizedRange.value;
  const employeeId = props.defaultEmployeeId ?? null;

  form.value = {
    kind: 'work',
    eventSubtype: 'holiday',
    description: '',
    startDate: start,
    endDate: end,
    startTime: '09:00',
    endTime: '17:00',
    departmentId: null,
    employeeId,
    employmentDetailId: null,
    worksiteId: null,
    includeLunchHour: false,
    lunchHourHours: 1,
  };

  if (props.workOnly) {
    form.value.kind = 'work';
  }

  applyEmploymentDefaults(employeeId);
}

watch(
  () => [props.modelValue, props.startDate, props.endDate] as const,
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
);

async function save() {
  if (!form.value.description.trim()) {
    $q.notify({ type: 'negative', message: 'Description is required.' });
    return;
  }

  if (form.value.kind === 'work' && !form.value.employeeId) {
    $q.notify({ type: 'negative', message: 'Employee is required for work events.' });
    return;
  }

  if (!form.value.startDate || !form.value.endDate) {
    $q.notify({ type: 'negative', message: 'Start and end dates are required.' });
    return;
  }

  if (form.value.endDate < form.value.startDate) {
    $q.notify({ type: 'negative', message: 'End date must be on or after start date.' });
    return;
  }

  const result = await calendarStore.createCalendar({
    startDate: form.value.startDate,
    endDate: form.value.endDate,
    startTime: form.value.startTime,
    endTime: form.value.endTime,
    employeeId: form.value.employeeId,
    employmentDetailId: form.value.employmentDetailId,
    departmentId: form.value.departmentId,
    worksiteId: form.value.worksiteId,
    includeLunchHour: form.value.includeLunchHour,
    ...(form.value.includeLunchHour ? { lunchHourHours: form.value.lunchHourHours } : {}),
    description: form.value.description.trim(),
  });

  if (result) {
    const rangeLabel =
      form.value.startDate === form.value.endDate
        ? formatCalendarDisplayDate(form.value.startDate)
        : `${formatCalendarDisplayDate(form.value.startDate)} – ${formatCalendarDisplayDate(form.value.endDate)}`;

    $q.notify({
      type: 'positive',
      message: `Shift created for ${rangeLabel}.`,
    });
    emit('saved');
    isOpen.value = false;
    return;
  }

  $q.notify({
    type: 'negative',
    message: calendarStore.error || 'Failed to create shift.',
  });
}
</script>

<style scoped>
.calendar-create-dialog {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.calendar-create-dialog :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
