<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="work-timesheet-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ title }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="closeDialog" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="submitForm">
          <q-input v-model="form.name" label="Timesheet name" outlined />

          <q-input v-model="form.startTime" label="Start time" mask="##:##">
            <template #append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="form.startTime" format24h />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <q-input v-model="form.endTime" label="End time" mask="##:##">
            <template #append>
              <q-icon name="access_time" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-time v-model="form.endTime" format24h />
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>

          <div>
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

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn flat label="Cancel" color="grey" @click="closeDialog" />
            <q-btn type="submit" color="primary" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type WorkTimesheetForm = {
  name: string;
  startTime: string;
  endTime: string;
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
  days: [],
});

function applyInitialValue() {
  form.value = props.initialValue
    ? { ...props.initialValue, days: [...props.initialValue.days] }
    : {
        name: '',
        startTime: '',
        endTime: '',
        days: [],
      };
}

function resetForm() {
  form.value = {
    name: '',
    startTime: '',
    endTime: '',
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
.work-timesheet-dialog-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.work-timesheet-dialog-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
