<template>
  <q-page class="login-designed-page">
    <LoginPageStage :layout="store.layout" />
    <div class="login-powered-by">Powered by DotDev</div>
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
  position: relative;
  height: 100%;
  max-height: 100%;
  min-height: 100%;
  padding: 0 !important;
  overflow: hidden;
}

.login-powered-by {
  position: absolute;
  left: 20px;
  bottom: 16px;
  z-index: 6;
  margin: 0;
  padding: 5px 10px;
  border-radius: 999px;
  color: #fff;
  background: rgba(15, 23, 42, 0.78);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.55), 0 2px 8px rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  font-size: 12px;
  letter-spacing: 0.02em;
  line-height: 1.2;
  pointer-events: none;
}
</style>
