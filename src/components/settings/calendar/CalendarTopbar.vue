<template>
  <div class="calendar-topbar">
    <div class="row items-center q-gutter-sm">
      <div class="text-h6">Calendar</div>
      <q-btn outline label="Today" class="q-ml-md" @click="emit('today')" />
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn flat round icon="chevron_left" @click="emit('prev')" />
      <q-btn flat round icon="chevron_right" @click="emit('next')" />
      <div class="calendar-title">{{ headerLabel }}</div>
    </div>

    <div class="row items-center q-gutter-sm">
      <q-btn-toggle v-model="modeModel" unelevated toggle-color="primary" :options="viewOptions" />
      <q-btn-toggle
        v-if="showApprovalToggle"
        v-model="approvalModeModel"
        unelevated
        toggle-color="primary"
        :options="approvalOptions"
        class="calendar-approval-toggle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  viewMode: 'day' | 'month' | 'year';
  viewOptions: Array<{ label: string; value: 'day' | 'month' | 'year' }>;
  headerLabel: string;
  approvalMode: 'calendar' | 'approvals';
  showApprovalToggle: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:viewMode', value: 'day' | 'month' | 'year'): void;
  (event: 'update:approvalMode', value: 'calendar' | 'approvals'): void;
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'today'): void;
}>();

const modeModel = computed({
  get: () => props.viewMode,
  set: (value: 'day' | 'month' | 'year') => emit('update:viewMode', value),
});

const approvalOptions = [
  { label: '', value: 'calendar', icon: 'calendar_month' },
  { label: '', value: 'approvals', icon: 'task_alt' },
];

const approvalModeModel = computed({
  get: () => props.approvalMode,
  set: (value: 'calendar' | 'approvals') => emit('update:approvalMode', value),
});
</script>

<style scoped>
.calendar-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 14px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.calendar-title {
  font-size: 20px;
  font-weight: 600;
  min-width: 160px;
  text-align: center;
}

.calendar-approval-toggle :deep(.q-btn) {
  min-width: 42px;
}
</style>
