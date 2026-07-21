<template>
  <q-form class="q-gutter-md" @submit="emit('submit')">
    <LeaveTypeSelect
      v-model="form.leaveTypeId"
      :rules="[(val: number | null | undefined) => !!val || 'Leave type is required']"
      :disable="isDisabled"
      :showAddNew="true"
      :showEdit="true"
      @change="emit('leaveTypeChange', $event)"
    />

    <DateField
      v-model="form.startDate"
      label="Start Date *"
      required
      :disable="isDisabled"
      @update:model-value="emit('dateChange')"
    />

    <DateField
      v-model="form.endDate"
      label="End Date *"
      required
      :rules="[
        (val: string | null) =>
          !form.startDate || (val !== null && val >= form.startDate) || 'End date must be after start date',
      ]"
      :disable="isDisabled"
      @update:model-value="emit('dateChange')"
    />

    <LeaveDurationSelect
      v-if="areDatesValid"
      v-model="form.duration"
      :start-date="form.startDate"
      :end-date="form.endDate"
      :disable="isDisabled"
      @change="emit('durationChange', $event)"
    />

    <q-input
      v-if="form.duration === 'Custom'"
      v-model="form.fromTime"
      label="From Time *"
      type="time"
      outlined
      :rules="[(val) => !!val || 'From time is required']"
      :disable="isDisabled"
    />

    <q-input
      v-if="form.duration === 'Custom'"
      v-model="form.toTime"
      label="To Time *"
      type="time"
      outlined
      :rules="[(val) => !!val || 'To time is required']"
      :disable="isDisabled"
    />

    <q-input
      v-model.number="form.multiplier"
      label="Pay rate multiplier"
      type="number"
      step="0.1"
      min="0"
      outlined
      readonly
      :disable="isDisabled"
      hint="Derived from the selected leave type (paid = 1.0, unpaid = 0)"
    />

    <q-input
      v-model="form.notes"
      label="Notes"
      type="textarea"
      outlined
      rows="3"
      :disable="isDisabled"
    />

    <q-banner v-if="accruedHours != null" rounded class="bg-blue-1 text-blue-10">
      <template #avatar><q-icon name="schedule" /></template>
      Accrued worked hours available: <strong>{{ accruedHours.toFixed(2) }}</strong>
      <div class="text-caption q-mt-xs">
        Surplus hours from prior weeks can offset this leave against the hours bank used for pool eligibility.
      </div>
    </q-banner>

    <q-toggle
      v-model="form.applyHoursBank"
      label="Apply accrued worked hours to this leave"
      :disable="isDisabled || (accruedHours != null && accruedHours <= 0)"
    />

    <q-input
      v-if="form.applyHoursBank"
      v-model.number="form.leaveHours"
      type="number"
      step="0.25"
      min="0"
      label="Leave hours to apply"
      outlined
      dense
      :disable="isDisabled"
      hint="Defaults from leave days × standard daily hours when left blank on save"
    />

    <q-file
      v-model="form.attachments"
      label="Attachments"
      outlined
      multiple
      clearable
      use-chips
      counter
      max-files="10"
      :accept="EMPLOYEE_DOCUMENT_ACCEPT"
      :disable="isDisabled"
      hint="Optional. PDF, Word, Excel, images, or text — up to 10 files, 20 MB each."
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <div class="row q-gutter-sm justify-end q-mt-lg">
      <q-btn
        flat
        :label="cancelLabel"
        color="grey"
        :disable="loading"
        @click="emit('cancel')"
      />
      <q-btn
        type="submit"
        :label="submitLabel"
        color="primary"
        :loading="loading"
        :disable="disabled"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import LeaveDurationSelect from '../common/LeaveDurationSelect.vue';
import { EMPLOYEE_DOCUMENT_ACCEPT } from '@hr/components/employee/document/employee-document-form';

export type LeaveFormModel = {
  leaveTypeId: number | null;
  startDate: string;
  endDate: string;
  duration: string | null;
  fromTime: string | null;
  toTime: string | null;
  totalDays: number | null;
  notes: string;
  multiplier: number;
  attachments: File[];
  applyHoursBank: boolean;
  leaveHours: number | null;
};

const props = withDefaults(
  defineProps<{
    loading?: boolean;
    disabled?: boolean;
    areDatesValid?: boolean;
    submitLabel?: string;
    cancelLabel?: string;
    accruedHours?: number | null;
  }>(),
  {
    loading: false,
    disabled: false,
    areDatesValid: false,
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    accruedHours: null,
  },
);

const form = defineModel<LeaveFormModel>({ required: true });

const emit = defineEmits<{
  leaveTypeChange: [value: number | null];
  durationChange: [value: string | null];
  dateChange: [];
  submit: [];
  cancel: [];
}>();

const isDisabled = computed(() => props.loading || props.disabled);
</script>
