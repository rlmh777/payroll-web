<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div>
          <div class="text-h6">Add work shift</div>
          <div class="text-caption text-grey-7">
            Schedule a one-off work assignment for this employee.
          </div>
        </div>
      </AppDialogHeader>

      <AppDialogBody>
        <AppDialogForm>
          <div class="col-12">
            <DateField v-model="form.date" label="Date" required />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.startTime"
              label="Start time"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="form.endTime"
              label="End time"
              type="time"
              outlined
              dense
            />
          </div>
          <div class="col-12">
            <q-input
              v-model="form.description"
              label="Description"
              outlined
              dense
              hint="Optional note for this shift"
            />
          </div>
        </AppDialogForm>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Save"
          :loading="calendarStore.isLoading"
          @click="onSave"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useCalendarStore } from '@hr/stores/calendar-store';

const props = defineProps<{
  modelValue: boolean;
  employeeId: string;
  defaultDate?: string | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const calendarStore = useCalendarStore();

const form = reactive({
  date: '',
  startTime: '08:00',
  endTime: '17:00',
  description: 'Scheduled work',
});

watch(() => props.modelValue, (open) => {
  if (!open) {
    return;
  }
  form.date = props.defaultDate ?? new Date().toISOString().slice(0, 10);
});

async function onSave() {
  if (!form.date) {
    return;
  }

  const created = await calendarStore.createCalendar({
    startDate: form.date,
    endDate: form.date,
    startTime: form.startTime,
    endTime: form.endTime,
    employeeId: props.employeeId,
    description: form.description || 'Scheduled work',
    type: 'work',
  });

  if (!created) {
    $q.notify({
      type: 'negative',
      message: calendarStore.error || 'Failed to create work shift.',
      position: 'top',
    });
    return;
  }

  $q.notify({ type: 'positive', message: 'Work shift added.', position: 'top' });
  emit('saved');
  emit('update:modelValue', false);
}
</script>
