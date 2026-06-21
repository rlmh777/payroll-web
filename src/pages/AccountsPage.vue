<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchAccounts />
      <q-card-section class="q-pa-none">
        <ViewAccounts />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAccountStore } from '../stores/account-store';
import SearchAccounts from '../components/account/SearchAccounts.vue';
import ViewAccounts from '../components/account/ViewAccounts.vue';

const accountStore = useAccountStore();

onMounted(async () => {
  // Fetch accounts on mount
  await accountStore.fetchAccounts();
});
</script>

<style scoped>
</style>
