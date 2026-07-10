<template>
  <!-- Logout / User Menu -->
  <q-btn flat round dense icon="account_circle">
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-card class="q-pa-xl w-400">
        <q-card-section class="text-center">
          <q-avatar size="60px" class="bg-primary text-white">
            <q-icon name="person" />
          </q-avatar>
          <div class="q-mt-sm text-weight-medium">{{ authStore.user?.name || 'User' }}</div>
          <div class="text-caption text-grey">{{ authStore.user?.email || 'Logged in' }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="around">
          <q-btn flat icon="logout" label="Logout" color="negative" @click="onLogout" />
        </q-card-actions>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';

const authStore = useAuthStore();
const router = useRouter();

async function onLogout() {
  await authStore.logout();
  void router.push('/login');
}
</script>
