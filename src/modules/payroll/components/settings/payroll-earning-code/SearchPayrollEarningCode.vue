<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
      Add Earning Code
    </q-btn>
  </q-card-section>

  <AddPayrollEarningCode />
</template>

<script setup lang="ts">
import { usePayrollEarningCodeStore } from 'src/stores/payroll-earning-code-store';
import AddPayrollEarningCode from './AddPayrollEarningCode.vue';

const store = usePayrollEarningCodeStore();
</script>
