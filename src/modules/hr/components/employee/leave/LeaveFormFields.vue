<template>
  <q-form class="leave-form" :class="{ 'leave-form--wide': wide }" @submit="emit('submit')">
    <div v-if="useLeaveTypeCards" class="leave-form__types">
      <LeaveTypeCards
        v-model="form.leaveTypeId"
        :items="leaveTypeCardItems"
        :disable="isDisabled"
        :loading="isLoadingLeaveTypes"
        @change="emit('leaveTypeChange', $event)"
      />
      <q-input
        :model-value="form.leaveTypeId == null ? '' : String(form.leaveTypeId)"
        :rules="[(val: string) => !!val || 'Leave type is required']"
        :disable="isDisabled"
        class="leave-form__type-error"
        borderless
        dense
      />
    </div>
    <LeaveTypeSelect
      v-else
      v-model="form.leaveTypeId"
      :rules="[(val: number | null | undefined) => !!val || 'Leave type is required']"
      :disable="isDisabled || Boolean(props.lockLeaveType)"
      :readonly="Boolean(props.lockLeaveType)"
      :showAddNew="props.showLeaveTypeActions !== false && !props.lockLeaveType"
      :showEdit="props.showLeaveTypeActions !== false && !props.lockLeaveType"
      @change="emit('leaveTypeChange', $event)"
    />

    <div class="leave-form__row">
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
    </div>

    <div class="leave-form__row">
      <LeaveDurationSelect
        v-model="form.duration"
        :start-date="form.startDate"
        :end-date="form.endDate"
        :disable="isDisabled || !areDatesValid"
        @change="emit('durationChange', $event)"
      />
      <q-input
        :model-value="totalDaysLabel"
        label="Total days"
        outlined
        dense
        readonly
        hint="Calculated from the date range and duration"
      />
    </div>
    <div class="text-caption text-grey-7 leave-duration-hint">
      Morning, afternoon, or custom hours apply to each working day in the range — for example, every morning in a week.
    </div>

    <div v-if="form.duration === 'Custom'" class="leave-form__row">
      <TimeField
        v-model="form.fromTime"
        label="From Time *"
        required
        :disable="isDisabled"
      />
      <TimeField
        v-model="form.toTime"
        label="To Time *"
        required
        :disable="isDisabled"
      />
    </div>

    <div class="leave-form__row">
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
        autogrow
        :disable="isDisabled"
      />
    </div>

    <q-banner v-if="accruedHours != null" rounded class="bg-blue-1 text-blue-10">
      <template #avatar><q-icon name="schedule" /></template>
      Accrued worked hours available: <strong>{{ accruedHours.toFixed(2) }}</strong>
      <div class="text-caption q-mt-xs">
        Surplus hours from prior weeks can offset this leave against the hours bank used for pool eligibility.
      </div>
    </q-banner>

    <div class="leave-form__row">
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
      <div v-else />
    </div>

    <q-banner
      v-if="certification.requiresCertification"
      rounded
      :class="proofRequired ? 'bg-orange-1 text-orange-10' : 'bg-grey-2 text-grey-8'"
    >
      <template #avatar>
        <q-icon :name="proofRequired ? 'warning' : 'info'" />
      </template>
      <div v-if="proofRequired && certification.allowed <= 0">
        Medical documentation is required for this leave type.
      </div>
      <div v-else-if="proofRequired">
        Medical documentation is required. This leave exceeds the
        {{ formatLeaveDays(certification.allowed) }} uncertified day(s) allowed this period
        ({{ formatLeaveDays(certification.used) }} already used).
      </div>
      <div v-else>
        {{ formatLeaveDays(certification.remaining) }} uncertified day(s) remaining this period
        without medical documentation.
      </div>
    </q-banner>

    <q-file
      v-model="form.attachments"
      :label="proofRequired ? 'Medical documentation *' : 'Attachments'"
      outlined
      multiple
      clearable
      use-chips
      counter
      max-files="10"
      :accept="EMPLOYEE_DOCUMENT_ACCEPT"
      :disable="isDisabled"
      :rules="attachmentRules"
      :hint="
        proofRequired
          ? 'Required. PDF, Word, Excel, images, or text — up to 10 files, 20 MB each.'
          : 'Optional. PDF, Word, Excel, images, or text — up to 10 files, 20 MB each.'
      "
    >
      <template #prepend>
        <q-icon name="attach_file" />
      </template>
    </q-file>

    <div class="row q-gutter-sm justify-end q-mt-md">
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
        :disable="disabled || (proofRequired && !hasAttachments)"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import TimeField from '@core/components/common/TimeField.vue';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import LeaveDurationSelect from '../common/LeaveDurationSelect.vue';
import LeaveTypeCards, { type LeaveTypeCardItem } from './LeaveTypeCards.vue';
import { EMPLOYEE_DOCUMENT_ACCEPT } from '@hr/components/employee/document/employee-document-form';
import { formatLeaveDays, leaveProofRequired } from '@hr/components/settings/leave/leave-type-form';
import { useEmployeeStore } from '@hr/stores/employee-store';
import { useLeaveBalanceStore } from '@hr/stores/leave-balance-store';

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
    lockLeaveType?: boolean;
    showLeaveTypeActions?: boolean;
    leaveTypePicker?: 'select' | 'cards';
    wide?: boolean;
  }>(),
  {
    loading: false,
    disabled: false,
    areDatesValid: false,
    submitLabel: 'Save',
    cancelLabel: 'Cancel',
    accruedHours: null,
    lockLeaveType: false,
    showLeaveTypeActions: true,
    leaveTypePicker: 'select',
    wide: false,
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

const employeeStore = useEmployeeStore();
const leaveBalanceStore = useLeaveBalanceStore();

const isDisabled = computed(() => props.loading || props.disabled);
const useLeaveTypeCards = computed(() => props.leaveTypePicker === 'cards');
const isLoadingLeaveTypes = computed(
  () => leaveBalanceStore.isLoading || employeeStore.isLoadingLeaveTypes,
);

const leaveTypeCardItems = computed((): LeaveTypeCardItem[] => {
  if (leaveBalanceStore.balances.length) {
    return leaveBalanceStore.balances.map((balance) => ({
      leaveTypeId: balance.leaveTypeId,
      name: balance.name,
      code: balance.code,
      isPaid: balance.isPaid,
      affectsBalance: balance.affectsBalance,
      availableDays: balance.availableDays,
      takenDays: balance.takenDays,
      scheduledDays: balance.scheduledDays,
    }));
  }

  return employeeStore.leaveTypes.map((leaveType) => ({
    leaveTypeId: Number(leaveType.id),
    name: leaveType.name,
    code: leaveType.code ?? null,
    isPaid: leaveType.isPaid !== false,
    affectsBalance: Boolean(leaveType.affectsBalance),
    availableDays: null,
    takenDays: 0,
    scheduledDays: 0,
  }));
});

const totalDaysLabel = computed(() => {
  if (form.value.totalDays == null) {
    return '—';
  }
  return formatLeaveDays(form.value.totalDays);
});

const selectedLeaveBalance = computed(() => {
  const leaveTypeId = form.value.leaveTypeId;
  if (leaveTypeId == null) {
    return null;
  }
  return leaveBalanceStore.balances.find((balance) => balance.leaveTypeId === leaveTypeId) ?? null;
});

const selectedLeaveType = computed(() => {
  const leaveTypeId = form.value.leaveTypeId;
  if (leaveTypeId == null) {
    return null;
  }
  return employeeStore.leaveTypes.find((leaveType) => Number(leaveType.id) === leaveTypeId) ?? null;
});

const certification = computed(() => {
  const balance = selectedLeaveBalance.value;
  const leaveType = selectedLeaveType.value;
  const requiresCertification = Boolean(
    balance?.requiresCertification ?? leaveType?.requiresCertification,
  );
  const allowed = Number(balance?.uncertifiedDaysAllowed ?? leaveType?.uncertifiedDaysAllowed ?? 0);
  const used = Number(balance?.uncertifiedDaysUsed ?? 0);
  const remaining = Math.max(0, allowed - used);

  return {
    requiresCertification,
    allowed,
    used,
    remaining,
  };
});

const proofRequired = computed(() =>
  leaveProofRequired({
    requiresCertification: certification.value.requiresCertification,
    uncertifiedDaysAllowed: certification.value.allowed,
    uncertifiedDaysUsed: certification.value.used,
    requestedDays: form.value.totalDays,
  }),
);

const hasAttachments = computed(
  () => Array.isArray(form.value.attachments) && form.value.attachments.length > 0,
);

const attachmentRules = computed(() => {
  if (!proofRequired.value) {
    return [];
  }
  return [
    (val: File[] | File | null | undefined) => {
      if (Array.isArray(val) && val.length > 0) {
        return true;
      }
      if (val instanceof File) {
        return true;
      }
      return 'Medical documentation is required for this leave.';
    },
  ];
});

watch(
  () => employeeStore.selectedEmployee?.id,
  async (employeeId) => {
    if (!employeeId) {
      return;
    }
    await leaveBalanceStore.fetchByEmployee(employeeId);
  },
  { immediate: true },
);
</script>

<style scoped>
.leave-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leave-form__row {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.leave-form--wide .leave-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  align-items: start;
}

.leave-form__types {
  width: 100%;
}

.leave-form__type-error :deep(.q-field__control) {
  display: none;
}

.leave-form__type-error.q-field--error {
  padding-top: 4px;
}

.leave-duration-hint {
  margin-top: -8px;
}

@media (max-width: 700px) {
  .leave-form--wide .leave-form__row {
    grid-template-columns: 1fr;
  }
}
</style>
