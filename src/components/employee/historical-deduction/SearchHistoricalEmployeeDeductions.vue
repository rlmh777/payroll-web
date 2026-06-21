<template>
  <div class="row q-gutter-md items-center">
    <q-space />
    <div class="col-auto">
      <q-btn color="primary" label="Add Historical Deduction" icon="add" @click="showAddDialog = true" />
    </div>
    <AddHistoricalEmployeeDeduction v-model="showAddDialog" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useHistoricalEmployeeDeductionStore } from '../../../stores/historical-employee-deduction-store';
import AddHistoricalEmployeeDeduction from './AddHistoricalEmployeeDeduction.vue';

const store = useHistoricalEmployeeDeductionStore();
const showAddDialog = ref(false);

const onSaved = async () => {
  await store.fetchHistoricalEmployeeDeductions();
};
</script>
