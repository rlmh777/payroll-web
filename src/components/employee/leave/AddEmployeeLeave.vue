<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-employee-leave-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Employee Leave</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <LeaveTypeSelect
            v-model="form.leaveTypeId"
            :rules="[(val: string | null | undefined) => !!val || 'Leave type is required']"
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
              label="Save"
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

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [employeeLeaveId: string];
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
  if (!form.value.leaveTypeId || !form.value.startDate || !form.value.endDate) {
    return;
  }

  if (!employeeStore.selectedEmployee?.id) {
    console.error('No employee selected');
    return;
  }

  const newEmployeeLeave = await employeeLeaveStore.createEmployeeLeave(
    employeeStore.selectedEmployee.id,
    form.value.leaveTypeId,
    form.value.startDate,
    form.value.endDate,
    form.value.notes || null,
    form.value.multiplier
  );

  if (newEmployeeLeave) {
    emit('saved', newEmployeeLeave.id);
    onClose();
  }
};

const onClose = () => {
  form.value = {
    leaveTypeId: null,
    startDate: '',
    endDate: '',
    notes: '',
    multiplier: 1.0,
  };
  isOpen.value = false;
};

// Fetch leave types when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    // Reset form to ensure clean state
    form.value = {
      leaveTypeId: null,
      startDate: '',
      endDate: '',
      notes: '',
      multiplier: 1.0,
    };
    await employeeStore.fetchLeaveTypes();
  }
});
</script>

<style scoped>
.add-employee-leave-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-employee-leave-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

