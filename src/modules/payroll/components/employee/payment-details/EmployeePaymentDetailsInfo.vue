<template>
  <payment-details-info v-if="employeeId" :employee-id="employeeId" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useEmployeeStore } from '@hr/stores/employee-store';
import PaymentDetailsInfo from './PaymentDetailsInfo.vue';

const employeeStore = useEmployeeStore();
const employeeId = computed(() => employeeStore.selectedEmployee?.id ?? '');
</script>
