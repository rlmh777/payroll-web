<template>
  <q-page class="timesheet-page column no-wrap">
    <ManageTimesheet />
  </q-page>
</template>

<script setup lang="ts">
import ManageTimesheet from 'src/components/timesheet/ManageTimesheet.vue';
</script>

<style scoped>
.timesheet-page {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}
</style>
