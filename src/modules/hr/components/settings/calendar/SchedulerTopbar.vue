<template>
  <div class="scheduler-topbar">
    <div class="row items-center q-gutter-sm">
      <div class="text-h6">Scheduler</div>
      <q-btn outline label="Today" class="q-ml-md" @click="emit('today')" />
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="chevron_left" @click="emit('prev')" />
      <q-btn flat round icon="chevron_right" @click="emit('next')" />
      <div class="scheduler-title">{{ headerLabel }}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn-toggle
        :model-value="viewMode"
        unelevated
        toggle-color="primary"
        :options="viewOptions"
        @update:model-value="emit('update:viewMode', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SchedulerViewMode } from '@hr/utils/scheduler-utils';

defineProps<{
  viewMode: SchedulerViewMode;
  headerLabel: string;
}>();

const emit = defineEmits<{
  (event: 'update:viewMode', value: SchedulerViewMode): void;
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'today'): void;
}>();

const viewOptions = [
  { label: 'Day', value: 'day' as const },
  { label: 'Week', value: 'week' as const },
];
</script>

<style scoped>
.scheduler-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 10px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
  flex-shrink: 0;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.scheduler-title {
  font-size: 16px;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}
</style>
