<template>
  <q-page class="q-pa-md">
    <AppraisalReminderCard />
  </q-page>
</template>

<script setup lang="ts">
import AppraisalReminderCard from '@hr/components/settings/appraisals/AppraisalReminderCard.vue';

defineProps<{ title?: string }>();
</script>
