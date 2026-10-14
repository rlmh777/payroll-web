<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search Districts..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn color="primary" icon="add" label="Add District" @click="store.openCreateDailog" />
  </q-card-section>
  <AddDistrict v-model="store.$state.isCreateOpen" />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useDistrictStore } from '../../stores/district-store';
import AddDistrict from '@core/components/shared/district/AddDistrict.vue';
const store = useDistrictStore();

// Auto fetch when search changes
watch(
  () => store.search,
  async (newSearch) => {
    // Always reset to page 1 on new search
    await store.fetchDistricts({ search: newSearch });
  },
);
</script>
