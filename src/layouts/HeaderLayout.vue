<template>
  <q-layout view="hHh lpR fFf" class="main-layout">
    <MainHeader :show-drawer-toggle="false" />
    <q-page-container class="main-page-container">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import MainHeader from 'src/components/navigation/common/MainHeader.vue';
</script>
