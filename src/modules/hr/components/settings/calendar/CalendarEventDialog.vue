<template>
  <q-dialog v-model="isOpen" @hide="emit('close')">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div class="text-h6">{{ dialogTitle }}</div>
      </AppDialogHeader>

      <AppDialogBody v-if="loading" class="q-py-xl flex flex-center">
        <q-spinner color="primary" size="32px" />
      </AppDialogBody>

      <template v-else-if="event">
        <AppDialogBody>
          <q-banner v-if="!editable" dense rounded class="bg-grey-2 text-grey-8 q-mb-md">
            Past events can be viewed but not edited.
          </q-banner>

          <q-list v-if="showDetailSummary" dense bordered separator class="rounded-borders q-mb-md">
            <q-item v-for="detail in detailRows" :key="detail.label">
              <q-item-section>
                <q-item-label caption>{{ detail.label }}</q-item-label>
                <q-item-label>{{ detail.value }}</q-item-label>
              </q-item-section>
            </q-item>
          </q-list>

          <AppDialogForm v-if="editable && event.source === 'scheduled_work'">
            <div class="col-12">
              <CalendarEventFormFields
                v-model:kind="eventForm.kind"
                v-model:event-subtype="eventForm.eventSubtype"
                v-model:description="eventForm.description"
                v-model:start-date="eventForm.startDate"
                v-model:end-date="eventForm.endDate"
                v-model:start-time="eventForm.startTime"
                v-model:end-time="eventForm.endTime"
                v-model:department-id="eventForm.departmentId"
                v-model:employee-id="eventForm.employeeId"
                v-model:employment-detail-id="eventForm.employmentDetailId"
                v-model:worksite-id="eventForm.worksiteId"
                v-model:include-lunch-hour="eventForm.includeLunchHour"
                v-model:lunch-hour-hours="eventForm.lunchHourHours"
                :employees="employees ?? []"
                :show-employee-picker="showEmployeePicker ?? false"
                :show-kind-picker="false"
                :is-series="isSeries"
              />
            </div>
          </AppDialogForm>

          <AppDialogForm v-else-if="editable && event.source === 'leave'">
            <div v-if="isSeries" class="col-12 text-caption text-grey-7">
              Editing the full leave period. This day is part of a multi-day leave.
            </div>
            <div class="col-12">
              <LeaveTypeSelect
                v-model="leaveForm.leaveTypeId"
                :disable="employeeLeaveStore.isLoading"
              />
            </div>
            <div class="col-12">
              <CalendarEventFormFields
                v-model:kind="eventForm.kind"
                v-model:event-subtype="eventForm.eventSubtype"
                v-model:description="eventForm.description"
                v-model:start-date="eventForm.startDate"
                v-model:end-date="eventForm.endDate"
                v-model:start-time="eventForm.startTime"
                v-model:end-time="eventForm.endTime"
                v-model:department-id="eventForm.departmentId"
                v-model:employee-id="eventForm.employeeId"
                v-model:worksite-id="eventForm.worksiteId"
                v-model:include-lunch-hour="eventForm.includeLunchHour"
                v-model:lunch-hour-hours="eventForm.lunchHourHours"
                :employees="employees ?? []"
                :show-employee-picker="showEmployeePicker ?? false"
                :show-kind-picker="false"
                :is-series="isSeries"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="leaveForm.notes"
                label="Notes"
                type="textarea"
                outlined
                dense
                autogrow
              />
            </div>
          </AppDialogForm>
        </AppDialogBody>

        <q-card-actions align="between" class="app-dialog-actions">
          <q-btn
            v-if="editable && event.source === 'scheduled_work'"
            flat
            color="negative"
            label="Delete"
            :loading="calendarStore.isLoading"
            @click="deleteScheduledWorkEntry"
          />
          <span v-else />

          <div class="row q-gutter-sm">
            <q-btn flat label="Close" v-close-popup />
            <q-btn
              v-if="editable && (event.source === 'scheduled_work' || event.source === 'leave')"
              color="primary"
              :label="event.source === 'leave' && isSeries ? 'Save leave period' : 'Save'"
              :loading="calendarStore.isLoading || employeeLeaveStore.isLoading"
              @click="event.source === 'scheduled_work' ? saveScheduledWork() : saveLeave()"
            />
          </div>
        </q-card-actions>
      </template>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import LeaveTypeSelect from '@hr/components/employee/common/LeaveTypeSelect.vue';
import CalendarEventFormFields from './CalendarEventFormFields.vue';
import {
  eventSubtypeFromCalendarType,
  kindFromCalendarType,
  type CalendarEventSubtype,
  type CalendarKind,
} from './calendarTypes';
import type { CalendarEntry } from '@hr/stores/calendar-store';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useEmployeeLeaveStore } from 'src/stores/employee-leave-store';
import {
  scheduledWorkIdFromEvent,
  canEditEvent,
  formatCalendarDateTimeRange,
  formatCalendarDisplayDate,
  formatCalendarTime,
  isFutureOrToday,
  isLeaveSeries,
  leaveIdFromEvent,
} from '@hr/utils/calendar-event-utils';

const props = defineProps<{
  modelValue: boolean;
  event: CalendarEntry | null;
  typeLabels: Record<string, string>;
  employees?: Array<{ id: string; firstName: string; lastName: string; code?: string }>;
  showEmployeePicker?: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'close'): void;
  (event: 'saved'): void;
}>();

const $q = useQuasar();
const calendarStore = useCalendarStore();
const employeeLeaveStore = useEmployeeLeaveStore();

const loading = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});


const editable = computed(() => (props.event ? canEditEvent(props.event) : false));

const showDetailSummary = computed(() => {
  if (!props.event) {
    return false;
  }

  return !isFutureOrToday(props.event.date);
});

const isSeries = computed(() => {
  if (!props.event) {
    return false;
  }

  if (isLeaveSeries(props.event)) {
    return true;
  }

  const start = props.event.start_date ?? props.event.date;
  const end = props.event.end_date ?? props.event.date;
  return Boolean(start && end && start !== end);
});

const dialogTitle = computed(() => {
  if (!props.event || !editable.value) {
    return 'Event details';
  }

  if (props.event.source === 'leave' && isSeries.value) {
    return 'Edit leave period';
  }

  return 'Edit shift';
});

const eventForm = ref({
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

const leaveForm = ref({
  leaveTypeId: null as number | null,
  notes: '',
  duration: 'Full Day',
  totalDays: 1,
});

const detailRows = computed(() => {
  if (!props.event) {
    return [];
  }

  const rows = [
    { label: 'Description', value: props.event.description },
    { label: 'Day', value: formatCalendarDisplayDate(props.event.date) },
  ];

  const when = formatCalendarDateTimeRange(props.event);
  if (when) {
    rows.push({ label: 'Schedule', value: when });
  }

  if (props.event.department_name) {
    rows.push({ label: 'Department', value: props.event.department_name });
  }

  if (props.event.employment_contract_label) {
    rows.push({ label: 'Contract', value: props.event.employment_contract_label });
  }

  if (props.event.compensation_label) {
    rows.push({ label: 'Compensation', value: props.event.compensation_label });
  }

  if (props.event.worksite_name) {
    rows.push({ label: 'Worksite', value: props.event.worksite_name });
  }

  if (props.event.include_lunch_hour) {
    const hours = props.event.lunch_hour_hours ?? 1;
    rows.push({ label: 'Lunch', value: `${hours}h deducted` });
  }

  if (props.event.employee_name) {
    rows.push({ label: 'Employee', value: props.event.employee_name });
  }

  if (props.event.calendar_group_name) {
    rows.push({ label: 'Calendar', value: props.event.calendar_group_name });
  }

  if (props.event.leave_type_name) {
    rows.push({ label: 'Leave type', value: props.event.leave_type_name });
  }

  if (props.event.approval_status) {
    rows.push({ label: 'Status', value: props.event.approval_status });
  }

  if (props.event.notes) {
    rows.push({ label: 'Notes', value: props.event.notes });
  }

  return rows;
});

function resetForms() {
  if (!props.event) {
    return;
  }

  eventForm.value = {
    kind: kindFromCalendarType(props.event.type),
    eventSubtype: eventSubtypeFromCalendarType(props.event.type),
    description: props.event.description,
    startDate: props.event.start_date ?? props.event.date,
    endDate: props.event.end_date ?? props.event.date,
    startTime: formatCalendarTime(props.event.start_time) || '09:00',
    endTime: formatCalendarTime(props.event.end_time) || '17:00',
    departmentId: props.event.department_id ?? null,
    employeeId: props.event.employee_id ?? null,
    employmentDetailId: props.event.employment_detail_id ?? null,
    worksiteId: props.event.worksite_id ?? null,
    includeLunchHour: Boolean(props.event.include_lunch_hour),
    lunchHourHours: props.event.lunch_hour_hours ?? 1,
  };

  leaveForm.value = {
    leaveTypeId: props.event.leave_type_id ? Number(props.event.leave_type_id) : null,
    notes: props.event.notes ?? '',
    duration: 'Full Day',
    totalDays: 1,
  };
}

async function loadLeaveForm() {
  if (!props.event || props.event.source !== 'leave') {
    return;
  }

  const leaveId = leaveIdFromEvent(props.event);
  if (!leaveId) {
    return;
  }

  loading.value = true;

  const leave = await employeeLeaveStore.fetchEmployeeLeaveById(leaveId);
  if (leave) {
    leaveForm.value = {
      leaveTypeId: Number(leave.leaveTypeId) || null,
      notes: leave.notes ?? '',
      duration: leave.duration || 'Full Day',
      totalDays: leave.totalDays || 1,
    };
    eventForm.value = {
      ...eventForm.value,
      startDate: leave.startDate,
      endDate: leave.endDate,
      startTime: formatCalendarTime(leave.fromTime) || '09:00',
      endTime: formatCalendarTime(leave.toTime) || '17:00',
      departmentId: leave.departmentId ? Number(leave.departmentId) : eventForm.value.departmentId,
      employeeId: leave.employeeId,
    };
  }

  loading.value = false;
}

watch(
  () => [props.modelValue, props.event?.id] as const,
  async ([open]) => {
    if (!open || !props.event) {
      return;
    }

    resetForms();

    if (props.event.source === 'leave' && editable.value) {
      await loadLeaveForm();
    }
  },
);

async function saveScheduledWork() {
  if (!props.event || props.event.source !== 'scheduled_work') {
    return;
  }

  const scheduledWorkId = scheduledWorkIdFromEvent(props.event);
  if (!scheduledWorkId) {
    return;
  }

  if (!eventForm.value.startDate || !eventForm.value.endDate) {
    $q.notify({ type: 'negative', message: 'Start date and end date are required.' });
    return;
  }

  if (!eventForm.value.employeeId) {
    $q.notify({ type: 'negative', message: 'Employee is required for work shifts.' });
    return;
  }

  const result = await calendarStore.updateCalendar(scheduledWorkId, {
    startDate: eventForm.value.startDate,
    endDate: eventForm.value.endDate,
    startTime: eventForm.value.startTime,
    endTime: eventForm.value.endTime,
    employeeId: eventForm.value.employeeId,
    employmentDetailId: eventForm.value.employmentDetailId,
    departmentId: eventForm.value.departmentId,
    worksiteId: eventForm.value.worksiteId,
    includeLunchHour: eventForm.value.includeLunchHour,
    ...(eventForm.value.includeLunchHour ? { lunchHourHours: eventForm.value.lunchHourHours } : {}),
    description: eventForm.value.description.trim(),
  });

  if (result) {
    $q.notify({ type: 'positive', message: 'Event updated.' });
    emit('saved');
    isOpen.value = false;
    return;
  }

  if (calendarStore.error) {
    $q.notify({ type: 'negative', message: calendarStore.error });
  }
}

async function saveLeave() {
  if (!props.event || props.event.source !== 'leave') {
    return;
  }

  const leaveId = leaveIdFromEvent(props.event);
  if (!leaveId || !leaveForm.value.leaveTypeId) {
    return;
  }

  const result = await employeeLeaveStore.updateEmployeeLeave(
    leaveId,
    eventForm.value.employeeId ?? props.event.employee_id ?? undefined,
    leaveForm.value.leaveTypeId,
    eventForm.value.startDate,
    eventForm.value.endDate,
    eventForm.value.startTime,
    eventForm.value.endTime,
    leaveForm.value.duration,
    leaveForm.value.totalDays,
    leaveForm.value.notes || null,
    undefined,
    eventForm.value.departmentId ?? undefined,
  );

  if (result) {
    $q.notify({ type: 'positive', message: 'Leave updated.' });
    emit('saved');
    isOpen.value = false;
    return;
  }

  if (employeeLeaveStore.error) {
    $q.notify({ type: 'negative', message: employeeLeaveStore.error });
  }
}

function deleteScheduledWorkEntry() {
  if (!props.event || props.event.source !== 'scheduled_work') {
    return;
  }

  $q.dialog({
    title: 'Delete shift',
    message: 'Delete this scheduled work series?',
    cancel: true,
  }).onOk(() => {
    void confirmDeleteScheduledWorkEntry();
  });
}

async function confirmDeleteScheduledWorkEntry() {
  if (!props.event || props.event.source !== 'scheduled_work') {
    return;
  }

  const scheduledWorkId = scheduledWorkIdFromEvent(props.event);
  if (!scheduledWorkId) {
    return;
  }

  try {
    await calendarStore.deleteCalendar(scheduledWorkId);
    $q.notify({ type: 'positive', message: 'Event deleted.' });
    emit('saved');
    isOpen.value = false;
  } catch {
    $q.notify({
      type: 'negative',
      message: calendarStore.error || 'Failed to delete event.',
    });
  }
}
</script>
