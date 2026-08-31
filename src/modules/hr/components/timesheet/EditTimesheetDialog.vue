<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="resetForm">
    <AppDialogCard>
      <AppDialogHeader>
        <div>
          <div class="text-h6">Edit timesheet record</div>
          <div class="text-caption text-grey-7">
            {{ group.employeeName || 'Employee' }}
            <span v-if="group.employeeCode"> · {{ group.employeeCode }}</span>
          </div>
        </div>
      </AppDialogHeader>

      <AppDialogBody>
        <AppDialogForm>
          <div class="col-12">
            <q-input
              :model-value="workDateLabel"
              label="Work date"
              outlined
              dense
              readonly
              :rules="[(value) => !!form.date || 'Date is required']"
            >
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date
                      v-model="form.date"
                      mask="YYYY-MM-DD"
                      :options="workDateOptions"
                    >
                      <div class="row items-center justify-end">
                        <q-btn v-close-popup label="Close" color="primary" flat />
                      </div>
                    </q-date>
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>

          <div class="col-12">
            <DepartmentSelect
              v-model="form.departmentId"
              label="Department worked for"
              clearable
            />
          </div>

          <div class="col-12">
            <WorksiteSelect
              v-model="form.worksiteId"
              label="Worksite"
              clearable
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockInTime"
              type="time"
              label="Clock in"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockOutTime"
              type="time"
              label="Clock out"
              outlined
              dense
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockInDeviceId"
              label="Clock-in device"
              outlined
              dense
              clearable
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockOutDeviceId"
              label="Clock-out device"
              outlined
              dense
              clearable
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.roundOffClockInTime"
              type="time"
              label="Rounded in"
              outlined
              dense
              :rules="[(value) => !!value || 'Rounded in is required']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.roundOffClockOutTime"
              type="time"
              label="Rounded out"
              outlined
              dense
              :rules="[(value) => !!value || 'Rounded out is required']"
            />
          </div>

          <div class="col-12 col-sm-6">
            <q-input
              v-model.number="form.lunchHourHours"
              type="number"
              label="Lunch hours"
              outlined
              dense
              step="0.25"
              min="0"
              max="8"
            />
          </div>

          <div class="col-12">
            <q-toggle
              v-model="form.isPaid"
              label="Mark hours as paid"
              color="positive"
              :disable="isPaidFromPayroll"
            />
            <div class="text-caption text-grey-7 q-mt-xs">
              {{
                isPaidFromPayroll
                  ? 'Automatically marked paid because this date is included in a posted payroll run.'
                  : 'Hours are also marked paid automatically when payroll is processed for this period.'
              }}
            </div>
          </div>

          <div class="col-12">
            <q-input
              v-model="form.comment"
              type="textarea"
              label="Comment"
              outlined
              dense
              autogrow
              maxlength="2000"
            />
          </div>
        </AppDialogForm>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Save"
          :loading="isSaving"
          :disable="!canSubmit"
          @click="submit"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import { useAttendanceStore, type TimesheetRow } from '@payroll/stores/attendance-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import type { TimesheetEmployeeGroup } from '@hr/stores/timesheet-store';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import WorksiteSelect from '@hr/components/worksite/WorksiteSelect.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  buildRoundOffDateTimes,
  toTimeInputValue,
} from '@hr/utils/timesheet-time-utils';

const props = defineProps<{
  modelValue: boolean;
  group: TimesheetEmployeeGroup;
  timesheet: TimesheetRow | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [];
}>();

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const timesheetStore = useTimesheetStore();

const isSaving = ref(false);

const form = ref({
  date: '',
  departmentId: null as number | null,
  worksiteId: null as number | null,
  clockInTime: '',
  clockOutTime: '',
  clockInDeviceId: '',
  clockOutDeviceId: '',
  roundOffClockInTime: '08:00',
  roundOffClockOutTime: '17:00',
  lunchHourHours: 0,
  isPaid: true,
  comment: '',
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const canSubmit = computed(
  () =>
    Boolean(form.value.date) &&
    Boolean(form.value.roundOffClockInTime) &&
    Boolean(form.value.roundOffClockOutTime) &&
    !isSaving.value,
);

const isPaidFromPayroll = computed(() => Boolean(props.timesheet?.hasBeenPaid));

const workDateLabel = computed(() => {
  if (!form.value.date) {
    return '';
  }

  return date.formatDate(form.value.date, 'MM/DD/YYYY');
});

function workDateOptions(dateValue: string): boolean {
  const normalized = dateValue.replace(/\//g, '-');
  if (props.timesheet?.date && normalized === props.timesheet.date) {
    return true;
  }

  return normalized >= timesheetStore.startDate && normalized <= timesheetStore.endDate;
}

function resetForm() {
  const row = props.timesheet;
  if (!row) {
    return;
  }

  form.value = {
    date: row.date,
    departmentId: row.departmentId == null ? null : Number(row.departmentId),
    worksiteId: row.worksiteId == null ? null : Number(row.worksiteId),
    clockInTime: toTimeInputValue(row.clockInTime),
    clockOutTime: toTimeInputValue(row.clockOutTime),
    clockInDeviceId: row.clockInDeviceId || '',
    clockOutDeviceId: row.clockOutDeviceId || '',
    roundOffClockInTime: toTimeInputValue(row.roundOffClockInTime) || '08:00',
    roundOffClockOutTime: toTimeInputValue(row.roundOffClockOutTime) || '17:00',
    lunchHourHours: Number(row.lunchHourHours ?? 0),
    isPaid: row.hasBeenPaid || row.isPaid !== false,
    comment: row.comment || '',
  };
}

async function submit() {
  if (!canSubmit.value || !props.timesheet) {
    return;
  }

  const { roundOffClockInTime, roundOffClockOutTime } = buildRoundOffDateTimes(
    form.value.date,
    form.value.roundOffClockInTime,
    form.value.roundOffClockOutTime,
  );

  if (!roundOffClockInTime || !roundOffClockOutTime) {
    $q.notify({ type: 'warning', message: 'Rounded clock-in and clock-out are required.' });
    return;
  }

  const clockTimes = buildRoundOffDateTimes(
    form.value.date,
    form.value.clockInTime,
    form.value.clockOutTime,
  );

  isSaving.value = true;

  const updated = await attendanceStore.updateTimesheet(props.timesheet.id, {
    date: form.value.date,
    departmentId: form.value.departmentId,
    worksiteId: form.value.worksiteId,
    employmentDetailId: props.group.employmentDetailId,
    roundOffClockInTime,
    roundOffClockOutTime,
    clockInTime: form.value.clockInTime ? clockTimes.roundOffClockInTime : null,
    clockOutTime: form.value.clockOutTime ? clockTimes.roundOffClockOutTime : null,
    clockInDeviceId: form.value.clockInDeviceId.trim() || null,
    clockOutDeviceId: form.value.clockOutDeviceId.trim() || null,
    lunchHourHours: Number(form.value.lunchHourHours || 0),
    isPaid: form.value.isPaid,
    comment: form.value.comment.trim() || null,
  });

  isSaving.value = false;

  if (!updated) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to update timesheet record.',
    });
    return;
  }

  $q.notify({ type: 'positive', message: 'Timesheet record updated.' });
  isOpen.value = false;
  emit('updated');
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      resetForm();
    }
  },
);
</script>
