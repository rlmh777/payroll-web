<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="calendar-dialog">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="text-h5">Assign Work Shift</div>
        <q-btn flat round icon="close" class="dialog-close" @click="closeDialog" />
      </q-card-section>
      <q-separator />
      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <q-select
              v-model="form.shift"
              :options="shiftOptions"
              label="Work timesheet"
              stack-label
              emit-value
              map-options
            />
          </div>
          <div class="col-12">
            <q-select
              v-model="form.departments"
              :options="departmentOptions"
              label="Departments"
              stack-label
              multiple
              use-chips
              emit-value
              map-options
            />
          </div>
          <div class="col-12">
            <q-input v-model="form.effectiveDate" label="Effective date" stack-label mask="####-##-##">
              <template #append>
                <q-icon name="event" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-date v-model="form.effectiveDate" mask="YYYY-MM-DD" />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input v-model="form.notes" label="Notes" stack-label />
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="calendar-dialog-actions">
        <q-btn flat label="Cancel" class="text-grey-7" @click="closeDialog" />
        <q-btn color="primary" label="Save" @click="submitForm" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type WorkShiftForm = {
  shift: string;
  departments: number[];
  effectiveDate: string;
  notes: string;
};

const props = defineProps<{
  modelValue: boolean;
  shiftOptions: Array<{ label: string; value: string }>;
  departmentOptions: Array<{ label: string; value: number }>;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'save', payload: WorkShiftForm): void;
}>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<WorkShiftForm>({
  shift: '',
  departments: [],
  effectiveDate: '',
  notes: '',
});

function resetForm() {
  form.value = {
    shift: '',
    departments: [],
    effectiveDate: '',
    notes: '',
  };
}

function closeDialog() {
  dialogModel.value = false;
  resetForm();
}

function submitForm() {
  emit('save', { ...form.value });
}

watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      resetForm();
    }
  },
);
</script>

<style scoped>
.calendar-dialog {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.calendar-dialog :deep(.q-card__section) {
  overflow-y: auto;
}

.calendar-dialog-actions {
  padding: 0 24px 24px;
}

.dialog-header {
  padding: 18px 24px;
}

.dialog-body {
  padding: 20px 24px;
}

.dialog-close {
  background: #efefef;
}
</style>
