<template>
  <q-page class="q-pa-md">
    <div class="text-h6 q-mb-md">Setting Calendars</div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-sm-6">
        <q-card
          class="calendar-general-card"
          clickable
          @click="goTo('/settings/general/calendar/work-shift-departments')"
        >
          <q-card-section class="text-center">
            <q-icon name="account_tree" size="44px" color="primary" />
            <div class="text-subtitle1 q-mt-sm">Work Shift to Departments</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';

const router = useRouter();

function goTo(path: string) {
  router.push(path).catch(() => undefined);
}
</script>

<style scoped>
.calendar-general-card {
  border-radius: 20px;
  min-height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.12);
}
</style>
