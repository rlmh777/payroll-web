<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchPersonalRelief />
      <q-card-section class="q-pa-none">
        <ViewPersonalRelief />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePersonalReliefStore } from '../../../stores/personal-relief-store';
import SearchPersonalRelief from './SearchPersonalRelief.vue';
import ViewPersonalRelief from './ViewPersonalRelief.vue';

const personalReliefStore = usePersonalReliefStore();

onMounted(async () => {
  // Fetch records on mount
  await personalReliefStore.fetchPersonalReliefs();
});
</script>

<style scoped>
</style>

