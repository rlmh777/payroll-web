<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="calendar-dialog">
      <q-card-section class="row items-center justify-between dialog-header">
        <div class="text-h5">{{ title }}</div>
        <q-btn flat round icon="close" class="dialog-close" @click="closeDialog" />
      </q-card-section>
      <q-separator />
      <q-card-section class="dialog-body">
        <div class="row q-col-gutter-sm">
          <div class="col-12">
            <q-input v-model="form.name" label="Timesheet name" stack-label />
          </div>
          <div class="col-12">
            <q-input v-model="form.startTime" label="Start time" stack-label mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.startTime" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input v-model="form.endTime" label="End time" stack-label mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="form.endTime" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12">
            <q-input
              v-model.number="form.breakMinutes"
              type="number"
              label="Break (minutes)"
              stack-label
            />
          </div>
          <div class="col-12">
            <div class="text-caption text-grey-6 q-mb-xs">Applies to days</div>
            <div class="row q-gutter-sm">
              <q-checkbox
                v-for="day in days"
                :key="day"
                v-model="form.days"
                :val="day"
                :label="day"
              />
            </div>
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

type WorkTimesheetForm = {
  name: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  days: string[];
};

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    days: string[];
    initialValue?: WorkTimesheetForm | null;
    title?: string;
  }>(),
  {
    initialValue: null,
    title: 'Add a Working Hours Timesheet',
  },
);

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'save', payload: WorkTimesheetForm): void;
}>();

const dialogModel = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = ref<WorkTimesheetForm>({
  name: '',
  startTime: '',
  endTime: '',
  breakMinutes: 0,
  days: [],
});

function applyInitialValue() {
  form.value = props.initialValue
    ? { ...props.initialValue, days: [...props.initialValue.days] }
    : {
        name: '',
        startTime: '',
        endTime: '',
        breakMinutes: 0,
        days: [],
      };
}

function resetForm() {
  form.value = {
    name: '',
    startTime: '',
    endTime: '',
    breakMinutes: 0,
    days: [],
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
    if (isOpen) {
      applyInitialValue();
    } else {
      resetForm();
    }
  },
);

watch(
  () => props.initialValue,
  () => {
    if (props.modelValue) {
      applyInitialValue();
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
