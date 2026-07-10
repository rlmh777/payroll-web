<template>
  <q-layout view="lHh Lpr lFf" class="login-layout">
    <q-page-container class="login-page-container">
      <q-banner
        v-if="showSessionExpiredBanner"
        class="bg-warning text-dark q-mb-md"
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