<template>
  <q-dialog v-model="dialogModel">
    <q-card class="calendar-dialog">
      <q-card-section class="row items-center justify-between">
        <div class="text-subtitle1">Create event</div>
        <q-btn flat round icon="close" v-close-popup />
      </q-card-section>
      <q-separator />
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12">
            <q-input v-model="descriptionModel" label="Description" outlined dense />
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="dateModel" label="Date" outlined dense />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              v-model="typeModel"
              :options="eventTypeOptions"
              label="Type"
              emit-value
              map-options
              outlined
              dense
            />
          </div>
          <div class="col-12">
            <q-input
              v-model.number="multiplierModel"
              type="number"
              label="Multiplier"
              outlined
              dense
            />
          </div>
        </div>
      </q-card-section>
      <q-separator />
      <q-card-actions align="right">
        <q-btn flat label="Cancel" v-close-popup />
        <q-btn color="primary" label="Save" :disable="!canAdd" @click="emit('save')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarType } from './calendarTypes';

const props = defineProps<{
  show: boolean;
  description: string;
  date: string;
  type: CalendarType;
  multiplier: number;
  eventTypeOptions: Array<{ label: string; value: CalendarType }>;
  canAdd: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void;
  (event: 'update:description', value: string): void;
  (event: 'update:date', value: string): void;
  (event: 'update:type', value: CalendarType): void;
  (event: 'update:multiplier', value: number): void;
  (event: 'save'): void;
}>();

const dialogModel = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
});

const descriptionModel = computed({
  get: () => props.description,
  set: (value: string) => emit('update:description', value),
});

const dateModel = computed({
  get: () => props.date,
  set: (value: string) => emit('update:date', value),
});

const typeModel = computed({
  get: () => props.type,
  set: (value: CalendarType) => emit('update:type', value),
});

const multiplierModel = computed({
  get: () => props.multiplier,
  set: (value: number) => emit('update:multiplier', value),
});
</script>

<style scoped>
.calendar-dialog {
  width: min(480px, 90vw);
}
</style>
