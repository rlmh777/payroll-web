<template>
  <q-page class="q-pa-md careers-page">
    <div class="careers-page__intro">
      <div class="text-h5">Open positions</div>
      <div class="text-body2 text-grey-7 q-mt-xs">
        Published jobs advertised to the public.
      </div>
    </div>

    <div v-if="store.isLoadingPublic" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <div v-else-if="!store.publicVacancies.length" class="text-grey-7 q-pa-lg">
      There are no public vacancies at the moment.
    </div>

    <div v-else class="careers-grid">
      <q-card
        v-for="job in store.publicVacancies"
        :key="job.id"
        class="job-card cursor-pointer"
        flat
        bordered
        @click="router.push(`/careers/${job.id}`)"
      >
        <q-card-section>
          <div class="text-h6">{{ job.title }}</div>
          <div class="text-subtitle2 text-grey-8">{{ job.job_title?.name }}</div>
          <div class="text-caption text-grey-7 q-mt-sm">
            <span v-if="job.worksite">{{ job.worksite.name }}</span>
            <span v-if="job.department"> · {{ job.department.name }}</span>
          </div>
          <div class="row q-gutter-xs q-mt-md">
            <q-badge color="primary" outline>{{ job.positions }} position{{ job.positions === 1 ? '' : 's' }}</q-badge>
            <q-badge v-if="job.require_resume" color="grey-8" outline>Resume required</q-badge>
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVacancyStore } from '@hr/stores/vacancy-store';

const store = useVacancyStore();
const router = useRouter();

onMounted(() => {
  void store.fetchPublicVacancies();
});
</script>

<style scoped>
.careers-page {
  max-width: 960px;
  margin: 0 auto;
}
.careers-page__intro {
  margin-bottom: 20px;
}
.careers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}
.job-card:hover {
  border-color: #94a3b8;
}
</style>
