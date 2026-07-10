<template>
  <q-page class="scheduler-page column no-wrap">
    <ManageCalendar />
  </q-page>
</template>

<script setup lang="ts">
import ManageCalendar from 'src/components/settings/calendar/ManageCalendar.vue';
</script>

<style scoped>
.scheduler-page {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
</style>
