<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchPayPeriodGroups />
      <q-card-section class="q-pa-none">
        <ViewPayPeriodGroups />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePayPeriodGroupStore } from '@/stores/pay-period-group-store';
import SearchPayPeriodGroups from './SearchPayPeriodGroups.vue';
import ViewPayPeriodGroups from './ViewPayPeriodGroups.vue';

const payPeriodGroupStore = usePayPeriodGroupStore();

onMounted(async () => {
  // Fetch records on mount
  await payPeriodGroupStore.fetchPayPeriodGroups();
});
</script>

<style scoped>
</style>
