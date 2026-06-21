<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Setting Calendars</div>
    <ManageCalendar />
  </q-page>
</template>

<script setup lang="ts">
import ManageCalendar from 'src/components/settings/calendar/ManageCalendar.vue';
</script>

<style scoped>
.calendar-setting-card {
  border-radius: 14px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
}
</style>
