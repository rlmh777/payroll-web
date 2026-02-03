<template>
  <aside class="calendar-sidebar">
    <q-btn
      color="primary"
      icon="add"
      label="Create"
      unelevated
      class="calendar-create"
      @click="emit('create')"
    />

    <q-card class="calendar-mini-card">
      <div class="row items-center justify-between q-mb-sm">
        <div class="text-subtitle2">{{ miniLabel }}</div>
        <div class="row items-center">
          <q-btn dense flat round icon="chevron_left" @click="emit('mini-prev')" />
          <q-btn dense flat round icon="chevron_right" @click="emit('mini-next')" />
        </div>
      </div>
      <q-date v-model="dateModel" mask="YYYY-MM-DD" minimal />
    </q-card>

    <div class="calendar-filters-panel">
      <div class="text-caption text-grey-6 q-mb-sm">Filters</div>
      <q-option-group v-model="filterModel" type="checkbox" :options="filterOptions" dense />
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarType, FilterOption } from './calendarTypes';

const props = defineProps<{
  selectedDate: string;
  miniLabel: string;
  filterOptions: FilterOption[];
  activeFilterList: CalendarType[];
}>();

const emit = defineEmits<{
  (event: 'update:selectedDate', value: string): void;
  (event: 'update:activeFilterList', value: CalendarType[]): void;
  (event: 'create'): void;
  (event: 'mini-prev'): void;
  (event: 'mini-next'): void;
}>();

const dateModel = computed({
  get: () => props.selectedDate,
  set: (value: string) => emit('update:selectedDate', value),
});

const filterModel = computed({
  get: () => props.activeFilterList,
  set: (value: CalendarType[]) => emit('update:activeFilterList', value),
});
</script>

<style scoped>
.calendar-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.calendar-create {
  border-radius: 999px;
  padding: 10px 18px;
  font-weight: 600;
  align-self: flex-start;
}

.calendar-mini-card {
  padding: 12px;
  border-radius: 16px;
  background: #ffffff;
  color: #1d1d1d;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

.calendar-filters-panel {
  padding: 12px;
  border-radius: 14px;
  background: #ffffff;
  color: #4a4a4a;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}

@media (max-width: 1024px) {
  .calendar-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
