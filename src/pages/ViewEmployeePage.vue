<template>
  <q-page>
    <div v-if="isLoading" class="row justify-center q-my-lg">
      <q-spinner-dots color="primary" size="40px" />
    </div>
    <div v-else-if="error" class="q-pa-md">
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
    <view-employee v-else-if="employee"  />
  </q-page>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useEmployeeStore } from 'src/stores/employee-store';
import ViewEmployee from 'src/components/employee/view/ViewEmployee.vue';
import type { Employee } from 'src/components/models';

const route = useRoute();
const employeeStore = useEmployeeStore();

const employee = ref<Employee | null>(null);
const isLoading = ref(true);
const error = ref<string | null>(null);

const fetchEmployee = async (employeeId: string) => {
  if (!employeeId) {
    error.value = 'Employee ID is required';
    isLoading.value = false;
    return;
  }

  isLoading.value = true;
  error.value = null;
  employee.value = null;

  try {
    const data = await employeeStore.fetchEmployeeById(employeeId);
    employee.value = data;
  } catch (err) {
    error.value = 'Failed to load employee. Please try again.';
    console.error('Error loading employee:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(
  () => route.params.id,
  async (employeeId) => {
    await fetchEmployee(employeeId as string);
  },
  { immediate: true }
);
</script>

<style scoped>
</style>

