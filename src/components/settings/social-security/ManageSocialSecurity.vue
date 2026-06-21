<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchSocialSecurity />
      <q-card-section class="q-pa-none">
        <ViewSocialSecurity />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSocialSecurityStore } from '../../../stores/social-security-store';
import SearchSocialSecurity from './SearchSocialSecurity.vue';
import ViewSocialSecurity from './ViewSocialSecurity.vue';

const socialSecurityStore = useSocialSecurityStore();

onMounted(async () => {
  // Fetch records on mount
  await socialSecurityStore.fetchSocialSecurities();
});
</script>

<style scoped>
</style>

