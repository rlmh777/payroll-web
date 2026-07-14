<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 380px">
      <q-card-section>
        <div class="text-h6">Add work shift</div>
        <div class="text-caption text-grey-7">
          Schedule a one-off work assignment for this employee.
        </div>
      </q-card-section>

      <q-card-section class="q-gutter-md q-pt-none">
        <DateField v-model="form.date" label="Date" required />
        <q-input
          v-model="form.startTime"
          label="Start time"
          type="time"
          outlined
          dense
        />
        <q-input
          v-model="form.endTime"
          label="End time"
          type="time"
          outlined
          dense
        />
        <q-input
          v-model="form.description"
          label="Description"
          outlined
          dense
          hint="Optional note for this shift"
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn
          color="primary"
          label="Save"
          :loading="calendarStore.isLoading"
          @click="onSave"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
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
