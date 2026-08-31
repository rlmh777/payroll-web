<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="resetForm">
    <AppDialogCard>
      <AppDialogHeader>
        <div>
          <div class="text-h6">Add timesheet record</div>
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

          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockInTime"
              type="time"
              label="Clock in"
              outlined
              dense
              :rules="[(value) => !!value || 'Clock in is required']"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.clockOutTime"
              type="time"
              label="Clock out"
              outlined
              dense
              :rules="[(value) => !!value || 'Clock out is required']"
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
import { date } from 'quasar';
import { useQuasar } from 'quasar';
import { useAttendanceStore } from '@payroll/stores/attendance-store';
import { useTimesheetStore } from '@hr/stores/timesheet-store';
import type { TimesheetEmployeeGroup } from '@hr/stores/timesheet-store';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { buildRoundOffDateTimes } from '@hr/utils/timesheet-time-utils';

const props = defineProps<{
  modelValue: boolean;
  group: TimesheetEmployeeGroup;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  created: [];
}>();

const $q = useQuasar();
const attendanceStore = useAttendanceStore();
const timesheetStore = useTimesheetStore();

const isSaving = ref(false);

const form = ref({
  date: '',
  departmentId: null as number | null,
  clockInTime: '08:00',
  clockOutTime: '17:00',
  lunchHourHours: 0,
  comment: '',
});

const isOpen = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const canSubmit = computed(
  () =>
    form.value.date &&
    form.value.clockInTime &&
    form.value.clockOutTime &&
    !isSaving.value,
);

const workDateLabel = computed(() => {
  if (!form.value.date) {
    return '';
  }

  return date.formatDate(form.value.date, 'MM/DD/YYYY');
});

function workDateOptions(dateValue: string): boolean {
  const normalized = dateValue.replace(/\//g, '-');
  return normalized >= timesheetStore.startDate && normalized <= timesheetStore.endDate;
}

function defaultDate(): string {
  const today = date.formatDate(new Date(), 'YYYY-MM-DD');
  if (today >= timesheetStore.startDate && today <= timesheetStore.endDate) {
    return today;
  }

  return timesheetStore.startDate;
}

function defaultDepartmentId(): number | null {
  if (props.group.departmentId != null) {
    return Number(props.group.departmentId);
  }

  const rowWithDepartment = props.group.rows.find((row) => row.departmentId != null);
  return rowWithDepartment?.departmentId == null ? null : Number(rowWithDepartment.departmentId);
}

function resetForm() {
  form.value = {
    date: defaultDate(),
    departmentId: defaultDepartmentId(),
    clockInTime: '08:00',
    clockOutTime: '17:00',
    lunchHourHours: 0,
    comment: '',
  };
}

async function submit() {
  if (!canSubmit.value) {
    return;
  }

  const { roundOffClockInTime, roundOffClockOutTime } = buildRoundOffDateTimes(
    form.value.date,
    form.value.clockInTime,
    form.value.clockOutTime,
  );

  if (!roundOffClockInTime || !roundOffClockOutTime) {
    $q.notify({ type: 'warning', message: 'Clock in and clock out are required.' });
    return;
  }

  isSaving.value = true;

  const created = await attendanceStore.createTimesheet({
    employeeId: props.group.employeeId,
    employmentDetailId: props.group.employmentDetailId,
    departmentId: form.value.departmentId,
    date: form.value.date,
    roundOffClockInTime,
    roundOffClockOutTime,
    lunchHourHours: Number(form.value.lunchHourHours || 0),
    comment: form.value.comment.trim() || null,
  });

  isSaving.value = false;

  if (!created) {
    $q.notify({
      type: 'negative',
      message: attendanceStore.error || 'Failed to create timesheet record.',
    });
    return;
  }

  $q.notify({ type: 'positive', message: 'Timesheet record added.' });
  isOpen.value = false;
  emit('created');
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
