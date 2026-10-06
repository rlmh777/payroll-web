<template>
  <q-page class="login-designed-page">
    <LoginPageStage :layout="store.layout" />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import LoginPageStage from '@core/components/login-page/LoginPageStage.vue';
import { useLoginPageStore } from '@core/stores/login-page-store';

const store = useLoginPageStore();

onMounted(() => {
  void store.fetchPublicLayout();
});
</script>

<style scoped>
.login-designed-page {
  height: 100vh;
  max-height: 100vh;
  min-height: 100vh;
  padding: 0 !important;
  overflow: hidden;
}
</style>
