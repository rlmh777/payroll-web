<template>
  <manage-employee-banks :employee-id="employeeId" />
</template>

<script setup lang="ts">
import ManageEmployeeBanks from './ManageEmployeeBanks.vue';

defineProps<{ employeeId: string }>();
</script>
