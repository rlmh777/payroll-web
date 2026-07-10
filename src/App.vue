<template>
  <div class="app-shell">
    <q-banner
      v-if="showNetworkBanner"
      class="network-banner bg-negative text-white"
      dense
      inline-actions
    >
      <template #avatar>
        <q-icon name="wifi_off" color="white" />
      </template>
      No internet connection. Changes may not save until you are back online.
      <template #action>
        <q-btn
          flat
          dense
          color="white"
          label="Retry"
          :loading="isRetrying"
          @click="retryConnection"
        />
      </template>
    </q-banner>

    <router-view />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useNetworkStore } from 'src/stores/network-store';
import { useAuthStore } from 'src/stores/auth';
import { useNetworkStatus } from 'src/composables/useNetworkStatus';
import { useSessionGuard } from 'src/composables/useSessionGuard';

const networkStore = useNetworkStore();
const authStore = useAuthStore();
const isRetrying = ref(false);

useNetworkStatus();
useSessionGuard();

const showNetworkBanner = computed(() => !networkStore.isOnline);

async function retryConnection() {
  isRetrying.value = true;

  try {
    if (!navigator.onLine) {
      networkStore.setOffline();
      return;
    }

    if (authStore.isAuthenticated) {
      const isValid = await authStore.validateSession({ force: true });
      networkStore.setOnline();
      if (!isValid) {
        return;
      }
    } else {
      networkStore.setOnline();
    }
  } finally {
    isRetrying.value = false;
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
}

.network-banner {
  position: sticky;
  top: 0;
  z-index: 7000;
}
</style>
