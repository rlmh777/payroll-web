<template>
  <q-layout view="lHh Lpr lFf" class="careers-layout">
    <q-header unelevated class="bg-white text-dark careers-header">
      <q-toolbar>
        <q-toolbar-title class="text-weight-medium">Careers</q-toolbar-title>
        <q-btn flat no-caps to="/login" label="Sign in" />
      </q-toolbar>
    </q-header>
    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
</script>

<style scoped>
.careers-header {
  border-bottom: 1px solid #e5e7eb;
}
</style>
