<template>
  <q-card-section class="row items-center q-gutter-sm">
    <div>
      <div class="text-h6">Account Mapping</div>
      <div class="text-body2 text-grey-7">
        Map payroll payment types (tax, social security, wages payable, and custom types) to GL accounts.
      </div>
    </div>
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
      Add Mapping
    </q-btn>
  </q-card-section>

  <AddPayrollAccountMapping />
</template>

<script setup lang="ts">
import { usePayrollAccountMappingStore } from 'src/stores/payroll-account-mapping-store';
import AddPayrollAccountMapping from './AddPayrollAccountMapping.vue';

const store = usePayrollAccountMappingStore();
</script>
