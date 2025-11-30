<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-employee-leave-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Employee Leave</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <LeaveTypeSelect
            v-model="form.leaveTypeId"
            :rules="[(val: number | null | undefined) => !!val || 'Leave type is required']"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            v-model="form.startDate"
            label="Start Date *"
            type="date"
            outlined
            :rules="[val => !!val || 'Start date is required']"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            v-model="form.endDate"
            label="End Date *"
            type="date"
            outlined
            :rules="[
              val => !!val || 'End date is required',
              val => !form.startDate || val >= form.startDate || 'End date must be after start date'
            ]"
            :disable="employeeLeaveStore.isLoading"
          />

          <q-input
            v-model.number="form.multiplier"
            label="Multiplier"
            type="number"
            step="0.1"
            min="0"
            outlined
            :disable="employeeLeaveStore.isLoading"
            hint="Leave multiplier (default: 1.0)"
          />

          <q-input
            v-model="form.notes"
            label="Notes"
            type="textarea"
            outlined
            rows="3"
            :disable="employeeLeaveStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="employeeLeaveStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="employeeLeaveStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useEmployeeLeaveStore } from '../../../stores/employee-leave-store';
import { useEmployeeStore } from '../../../stores/employee-store';
import LeaveTypeSelect from '../common/LeaveTypeSelect.vue';
import type { EmployeeLeave } from '../../models';

interface Props {
  modelValue: boolean;
  employeeLeave: EmployeeLeave | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  employeeLeave: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [employeeLeaveId: string];
}>();

const employeeLeaveStore = useEmployeeLeaveStore();
const employeeStore = useEmployeeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  leaveTypeId: null as number | null,
  startDate: '',
  endDate: '',
  notes: '',
  multiplier: 1.0 as number,
});

const onSubmit = async () => {
  if (!form.value.leaveTypeId || !form.value.startDate || !form.value.endDate || !props.employeeLeave) {
    return;
  }

  const updatedEmployeeLeave = await employeeLeaveStore.updateEmployeeLeave(
    props.employeeLeave.id,
    undefined, // employeeId - not updating
    form.value.leaveTypeId || undefined,
    form.value.startDate,
    form.value.endDate,
    form.value.notes || null,
    form.value.multiplier
  );

  if (updatedEmployeeLeave) {
    emit('updated', updatedEmployeeLeave.id);
    onClose();
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load employee leave data when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue && props.employeeLeave) {
    // Populate form with existing data
    form.value = {
      leaveTypeId: props.employeeLeave.leaveTypeId ? (typeof props.employeeLeave.leaveTypeId === 'string' ? Number(props.employeeLeave.leaveTypeId) : props.employeeLeave.leaveTypeId) : null,
      startDate: props.employeeLeave.startDate || '',
      endDate: props.employeeLeave.endDate || '',
      notes: props.employeeLeave.notes || '',
      multiplier: props.employeeLeave.multiplier || 1.0,
    };
    // Fetch leave types if not already loaded
    if (employeeStore.leaveTypes.length === 0) {
      await employeeStore.fetchLeaveTypes();
    }
  }
});
</script>

<style scoped>
.edit-employee-leave-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-employee-leave-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

