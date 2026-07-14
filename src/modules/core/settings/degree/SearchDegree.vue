<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search degrees..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDailog()">
      Add Degree
    </q-btn>
  </q-card-section>

  <AddDegree v-model="store.$state.isCreateOpen" />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useDegreeStore } from '../../stores/degree-store';
import AddDegree from './AddDegree.vue';
const store = useDegreeStore();

// Auto fetch when search changes
watch(
  () => store.search,
  async () => {
    // Always reset to page 1 on new search
    await store.fetchDegrees();
  },
);
</script>
