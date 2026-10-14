<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search institutions..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn color="primary" icon="add" label="Add Institution" @click="store.openCreateDailog()" />
  </q-card-section>

  <AddInstitution v-model="store.$state.isCreateOpen" />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useInstitutionStore } from '../../stores/institution-store';
import AddInstitution from './AddInstitution.vue';
const store = useInstitutionStore();

// Auto fetch when search changes
watch(
  () => store.search,
  async () => {
    // Always reset to page 1 on new search
    await store.fetchInstitutions();
  },
);
</script>
