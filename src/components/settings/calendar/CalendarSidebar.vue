<template>
  <aside class="calendar-sidebar">
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
      <div class="text-caption text-grey-6 q-mb-sm">My calendars</div>
      <q-list dense>
        <q-item v-for="group in calendarGroups" :key="group.id" class="calendar-filter-item">
          <q-item-section avatar>
            <q-checkbox v-model="groupModel" :val="group.id" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ group.name }}</q-item-label>
          </q-item-section>
          <q-item-section side>
            <span class="calendar-group-dot" :style="{ backgroundColor: group.color }"></span>
          </q-item-section>
        </q-item>
      </q-list>
    </div>

    <div v-if="canViewEmployees" class="calendar-filters-panel">
      <div class="text-caption text-grey-6 q-mb-sm">Employees</div>
      <q-list dense class="calendar-employee-list">
        <q-item clickable @click="employeeModel = null">
          <q-item-section avatar>
            <q-radio :model-value="employeeModel" :val="null" />
          </q-item-section>
          <q-item-section>
            <q-item-label>All employees</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator spaced />
        <q-item
          v-for="employee in employees"
          :key="employee.id"
          clickable
          @click="employeeModel = employee.id"
        >
          <q-item-section avatar>
            <q-radio :model-value="employeeModel" :val="employee.id" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ employeeLabel(employee) }}</q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { CalendarGroup } from './calendarTypes';

const props = defineProps<{
  selectedDate: string;
  miniLabel: string;
  calendarGroups: CalendarGroup[];
  activeGroupIds: string[];
  canViewEmployees: boolean;
  employees: Array<{ id: string; firstName: string; lastName: string; code?: string }>;
  selectedEmployeeId: string | null;
}>();

const emit = defineEmits<{
  (event: 'update:selectedDate', value: string): void;
  (event: 'update:activeGroupIds', value: string[]): void;
  (event: 'update:selectedEmployeeId', value: string | null): void;
  (event: 'mini-prev'): void;
  (event: 'mini-next'): void;
}>();

const dateModel = computed({
  get: () => props.selectedDate,
  set: (value: string) => emit('update:selectedDate', value),
});

const groupModel = computed({
  get: () => props.activeGroupIds,
  set: (value: string[]) => emit('update:activeGroupIds', value),
});

const employeeModel = computed({
  get: () => props.selectedEmployeeId,
  set: (value: string | null) => emit('update:selectedEmployeeId', value),
});

const employeeLabel = (employee: { firstName: string; lastName: string; code?: string }) => {
  const name = `${employee.firstName} ${employee.lastName}`.trim();
  return employee.code ? `${name} · ${employee.code}` : name;
};
</script>

<style scoped>
.calendar-sidebar {
  display: flex;
  flex-direction: column;
  gap: 18px;
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

.calendar-filter-item {
  padding: 2px 4px;
}

.calendar-group-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  display: inline-block;
}

.calendar-employee-list {
  max-height: 220px;
  overflow-y: auto;
}

@media (max-width: 1024px) {
  .calendar-sidebar {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
