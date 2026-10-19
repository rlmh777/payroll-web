<template>
  <q-page>
    <div v-if="error" class="q-pa-md">
      <q-banner class="bg-negative text-white">
        <template v-slot:avatar>
          <q-icon name="error" />
        </template>
        {{ error }}
        <template v-slot:action>
          <q-btn flat label="Go Back" @click="$router.push('/')" />
        </template>
      </q-banner>
    </div>
    <div v-else-if="!employee" class="row justify-center q-my-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>
    <div v-else class="employee-flip-scene">
      <div
        ref="flipCard"
        class="employee-flip-card"
        :class="{ 'employee-flip-card--instant': flipInstant }"
        :style="{ transform: `rotateY(${flipAngle}deg)` }"
      >
        <view-employee :key="employee.id" />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useEmployeeStore } from '@hr/stores/employee-store';
import ViewEmployee from '@hr/components/employee/view/ViewEmployee.vue';
import type { Employee } from '@core/types/models';

const FLIP_HALF_MS = 280;

const route = useRoute();
const employeeStore = useEmployeeStore();

const employee = ref<Employee | null>(null);
const error = ref<string | null>(null);
const flipCard = ref<HTMLElement | null>(null);
const flipAngle = ref(0);
const flipInstant = ref(false);
let flipGeneration = 0;

const pendingEmployeeId = computed(() => route.params.id as string | undefined);

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function showEmployee(next: Employee) {
  employeeStore.selectedEmployee = next;
  employee.value = next;
}

async function flipToEmployee(next: Employee) {
  if (!employee.value || employee.value.id === next.id || prefersReducedMotion()) {
    showEmployee(next);
    return;
  }

  const generation = ++flipGeneration;
  flipInstant.value = false;
  flipAngle.value = -90;
  await wait(FLIP_HALF_MS);
  if (generation !== flipGeneration) {
    return;
  }

  flipInstant.value = true;
  showEmployee(next);
  flipAngle.value = 90;
  await nextTick();
  flipCard.value?.getBoundingClientRect();
  if (generation !== flipGeneration) {
    return;
  }

  flipInstant.value = false;
  flipAngle.value = 0;
  await wait(FLIP_HALF_MS);
}

const fetchEmployee = async (employeeId: string) => {
  if (!employeeId) {
    error.value = 'Employee ID is required';
    employee.value = null;
    return;
  }

  error.value = null;
  const listedEmployee = employeeStore.employees.find((item) => item.id === employeeId) ?? null;
  let loadedEmployee: Employee | undefined;
  const fetchPromise = employeeStore.fetchEmployeeById(employeeId, false).then((data) => {
    loadedEmployee = data;
    return data;
  });

  const switching = Boolean(employee.value) && employee.value?.id !== employeeId;
  if (switching) {
    if (listedEmployee) {
      await flipToEmployee(listedEmployee);
    } else {
      const data = await fetchPromise;
      if (pendingEmployeeId.value !== employeeId || !data) {
        return;
      }
      await flipToEmployee(data);
    }
  }

  try {
    const data = loadedEmployee ?? (await fetchPromise);
    if (pendingEmployeeId.value !== employeeId || !data) {
      return;
    }
    if (employee.value?.id === data.id) {
      showEmployee(data);
      return;
    }
    await flipToEmployee(data);
  } catch (err) {
    if (pendingEmployeeId.value !== employeeId) {
      return;
    }
    error.value = 'Failed to load employee. Please try again.';
    console.error('Error loading employee:', err);
  }
};

watch(
  () => route.params.id,
  (employeeId) => {
    void fetchEmployee(employeeId as string);
  },
  { immediate: true },
);
</script>

<style scoped>
.employee-flip-scene {
  perspective: 1600px;
}

.employee-flip-card {
  transform-origin: center center;
  transition: transform 0.28s ease;
}

.employee-flip-card--instant {
  transition: none;
}
</style>
