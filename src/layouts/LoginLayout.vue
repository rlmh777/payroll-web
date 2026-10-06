<template>
  <q-layout view="lHh Lpr lFf" class="login-layout">
    <q-page-container class="login-page-container">
      <q-banner
        v-if="showSessionExpiredBanner"
        class="login-session-banner bg-warning text-dark"
        rounded
        dense
      >
        Your session has expired. Please sign in again to continue.
      </q-banner>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const showSessionExpiredBanner = computed(() => route.query.reason === 'session-expired');
</script>

<style scoped>
.login-session-banner {
  position: absolute;
  top: 16px;
  left: 50%;
  z-index: 20;
  width: calc(100% - 32px);
  max-width: 480px;
  transform: translateX(-50%);
}
</style>
