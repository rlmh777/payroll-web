<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search Localities..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDailog">
      Add Locality
    </q-btn>
  </q-card-section>
  <AddLocality v-model="store.$state.isCreateOpen" />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useLocalityStore } from '../../../stores/locality-store';
import AddLocality from '../../../components/locality/AddLocality.vue';

const store = useLocalityStore();

// Auto fetch when search changes
watch(
  () => store.search,
  async (newSearch) => {
    // Always reset to page 1 on new search
    await store.fetchLocalities({ search: newSearch });
  },
);
</script>
