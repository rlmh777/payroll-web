<template>
  <q-dialog v-model="dialogModel" position="right" :maximized="false">
    <q-card class="calendar-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Create schedule timesheet</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <q-input v-model="dateModel" label="Date" outlined />
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="startTimeModel" label="Start time" outlined mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="startTimeModel" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
          <div class="col-12 col-sm-6">
            <q-input v-model="endTimeModel" label="End time" outlined mask="##:##">
              <template #append>
                <q-icon name="access_time" class="cursor-pointer">
                  <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                    <q-time v-model="endTimeModel" format24h />
                  </q-popup-proxy>
                </q-icon>
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>
      <q-card-actions align="right" class="calendar-dialog-actions">
        <q-btn flat label="Cancel" color="grey" v-close-popup />
        <q-btn color="primary" label="Save" :disable="!canAdd" @click="emit('save')" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
const props = defineProps<{
  show: boolean;
  date: string;
  startTime: string;
  endTime: string;
  canAdd: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void;
  (event: 'update:date', value: string): void;
  (event: 'update:startTime', value: string): void;
  (event: 'update:endTime', value: string): void;
  (event: 'save'): void;
}>();

const dialogModel = computed({
  get: () => props.show,
  set: (value: boolean) => emit('update:show', value),
});

const dateModel = computed({
  get: () => props.date,
  set: (value: string) => emit('update:date', value),
});

const startTimeModel = computed({
  get: () => props.startTime,
  set: (value: string) => emit('update:startTime', value),
});

const endTimeModel = computed({
  get: () => props.endTime,
  set: (value: string) => emit('update:endTime', value),
});
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
</style>
