<script setup lang="ts">
import { MODULE_ROUTES } from '@core/config/module-routes';
</script>

<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Leave Calendar</div>
    <q-card flat bordered class="q-pa-md">
      <p class="q-mb-md">
        View approved and pending leave alongside other scheduled events on the company calendar.
      </p>
      <q-btn
        color="primary"
        icon="calendar_month"
        label="Open scheduler"
        :to="MODULE_ROUTES.scheduler"
      />
    </q-card>
  </q-page>
</template>
