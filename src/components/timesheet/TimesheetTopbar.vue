<template>
  <div class="timesheet-topbar">
    <div class="row items-center q-gutter-sm">
      <div class="text-h6">Timesheet</div>
      <q-btn outline label="Today" class="q-ml-md" @click="emit('today')" />
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="chevron_left" @click="emit('prev')" />
      <q-btn flat round icon="chevron_right" @click="emit('next')" />
      <div class="timesheet-title">{{ headerLabel }}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <q-chip outline color="primary" icon="groups" :label="`${employeeCount} employees`" />
      <TimesheetColumnPicker />
    </div>
  </div>
</template>

<script setup lang="ts">
import TimesheetColumnPicker from './TimesheetColumnPicker.vue';

defineProps<{
  headerLabel: string;
  employeeCount: number;
}>();

const emit = defineEmits<{
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'today'): void;
}>();
</script>

<style scoped>
.timesheet-topbar {
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

.timesheet-title {
  font-size: 16px;
  font-weight: 600;
  min-width: 180px;
  text-align: center;
}
</style>
