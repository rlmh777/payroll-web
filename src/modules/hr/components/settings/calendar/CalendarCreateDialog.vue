<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="emit('close')">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ dialogTitle }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-banner
          v-if="leaveConflictMessage"
          dense
          rounded
          class="bg-orange-1 text-orange-10 q-mb-md"
        >
          {{ leaveConflictMessage }} You can still schedule; clocked work will be recorded for payment.
        </q-banner>

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
      </AppDialogBody>

      <AppDialogActions>
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
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import CalendarEventFormFields from './CalendarEventFormFields.vue';
import {
  type CalendarEventSubtype,
  type CalendarKind,
} from './calendarTypes';
import { useCalendarStore, type CalendarEmployee, type CalendarEntry } from '@hr/stores/calendar-store';
import {
  getActiveEmploymentDetail,
  getEmploymentContractOptions,
} from '@hr/utils/calendar-employment-utils';
import { formatCalendarDisplayDate, normalizeDateRange } from '@hr/utils/calendar-event-utils';
import {
  findSchedulerLeaveConflicts,
  formatSchedulerLeaveConflictMessage,
} from '@hr/utils/scheduler-leave-conflicts';

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
  leaveEvents?: CalendarEntry[];
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

const leaveConflictMessage = computed(() => {
  if (form.value.kind !== 'work') {
    return '';
  }

  const conflicts = findSchedulerLeaveConflicts(
    props.leaveEvents ?? [],
    form.value.employeeId,
    form.value.startDate,
    form.value.endDate,
    form.value.startTime,
    form.value.endTime,
  );

  return formatSchedulerLeaveConflictMessage(conflicts);
});

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

  if (leaveConflictMessage.value) {
    $q.notify({
      type: 'warning',
      message: leaveConflictMessage.value,
      caption: 'Shift will still be saved. Clocked work remains payable.',
      timeout: 4500,
    });
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
