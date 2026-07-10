<template>
  <manage-employee-contacts v-if="employeeId" :employee-id="employeeId" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from 'src/stores/employee-store';
import ManageEmployeeContacts from './ManageEmployeeContacts.vue';

const employeeStore = useEmployeeStore();
const employeeId = computed(() => employeeStore.selectedEmployee?.id ?? '');
</script>
