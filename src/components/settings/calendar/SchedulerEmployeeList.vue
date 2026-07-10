<template>
  <div class="scheduler-employee-list">
    <div class="row q-gutter-md">
      <div class="col-12">
        <q-card
          class="employee-card"
          :class="{ 'employee-card-selected': !schedulerStore.filterEmployeeId }"
          @click="selectEmployee(null)"
        >
          <q-card-section class="employee-info-section">
            <div class="row items-center">
              <q-avatar color="grey-6" text-color="white" size="48px" class="q-mr-md" icon="groups" />
              <div class="col">
                <div class="text-h6 text-weight-medium">All employees</div>
                <div class="text-caption text-grey-7">Show everyone in the schedule</div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>

      <div v-for="employee in employees" :key="employee.id" class="col-12">
        <q-card
          class="employee-card"
          :class="{ 'employee-card-selected': schedulerStore.filterEmployeeId === employee.id }"
          @click="selectEmployee(employee.id)"
        >
          <q-card-section class="employee-info-section">
            <div class="row items-center">
              <q-avatar
                :style="{ backgroundColor: getAvatarColor(employee.lastName) }"
                text-color="white"
                size="48px"
                class="q-mr-md"
                font-size="20px"
              >
                {{ getInitial(employee.lastName) }}
              </q-avatar>
              <div class="col">
                <div class="text-h6 text-weight-medium q-mb-xs">
                  {{ employee.firstName }} {{ employee.lastName }}
                </div>
                <div v-if="employee.code" class="text-caption text-grey-7">
                  {{ employee.code }}
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>

    <q-infinite-scroll
      :offset="200"
      :disable="!hasMore || loadingMore"
      @load="onLoadMore"
    >
      <template #loading>
        <div class="row justify-center q-my-md">
          <q-spinner-dots color="primary" size="32px" />
        </div>
      </template>
    </q-infinite-scroll>
  </div>
</template>

<script setup lang="ts">
import type { CalendarEmployee } from 'src/stores/calendar-store';
import { useSchedulerStore } from 'src/stores/scheduler-store';

const props = defineProps<{
  employees: CalendarEmployee[];
  hasMore?: boolean;
  loadingMore?: boolean;
  loadMore?: () => Promise<void>;
}>();

const schedulerStore = useSchedulerStore();

async function onLoadMore(_index: number, done: (stop?: boolean) => void) {
  if (props.loadMore) {
    await props.loadMore();
  }

  done(!props.hasMore);
}

function selectEmployee(employeeId: string | null) {
  schedulerStore.setFilterEmployeeId(employeeId);
}

const getInitial = (lastName: string | undefined | null): string => {
  if (!lastName) return '?';
  return lastName.charAt(0).toUpperCase();
};

const getAvatarColor = (lastName: string | undefined | null): string => {
  const colors: string[] = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b', '#0097a7', '#5d4037', '#455a64',
    '#d32f2f', '#0288d1', '#00796b', '#8e24aa', '#e64a19', '#303f9f', '#c62828', '#558b2f',
  ];

  if (!lastName) {
    return colors[0]!;
  }

  const initial = lastName.charAt(0).toUpperCase();
  return colors[initial.charCodeAt(0) % colors.length]!;
};
</script>

<style scoped>
.scheduler-employee-list {
  width: 100%;
}

.employee-card {
  position: relative;
  transition: box-shadow 0.3s ease;
  cursor: pointer;
}

.employee-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.employee-card-selected {
  background-color: #f5f5f5;
  border-left: 4px solid var(--q-primary);
}

.employee-info-section {
  padding-top: 16px;
  padding-bottom: 16px;
}
</style>
