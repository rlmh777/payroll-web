<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Top main menu -->
    <MainHeader />
    <!-- Side drawer -->
    <SideDrawer />
    <q-page-container class="q-ma-md">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import MainHeader from 'src/components/navigation/common/MainHeader.vue';
import SideDrawer from 'src/components/navigation/common/SideDrawer.vue';
</script>
