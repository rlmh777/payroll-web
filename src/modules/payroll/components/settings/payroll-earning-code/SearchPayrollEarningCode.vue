<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-space />
    <q-btn color="primary" icon="add" label="Add Earning Code" @click="store.openCreateDialog()" />
  </q-card-section>

  <AddPayrollEarningCode />
</template>

<script setup lang="ts">
import { usePayrollEarningCodeStore } from 'src/stores/payroll-earning-code-store';
import AddPayrollEarningCode from './AddPayrollEarningCode.vue';

const store = usePayrollEarningCodeStore();
</script>
