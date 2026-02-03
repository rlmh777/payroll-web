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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  viewMode: 'day' | 'month' | 'year';
  viewOptions: Array<{ label: string; value: 'day' | 'month' | 'year' }>;
  headerLabel: string;
}>();

const emit = defineEmits<{
  (event: 'update:viewMode', value: 'day' | 'month' | 'year'): void;
  (event: 'prev'): void;
  (event: 'next'): void;
  (event: 'today'): void;
}>();

const modeModel = computed({
  get: () => props.viewMode,
  set: (value: 'day' | 'month' | 'year') => emit('update:viewMode', value),
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
</style>
