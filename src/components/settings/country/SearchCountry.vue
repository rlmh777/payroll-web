<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search countries..."
      clearable
      class="col-10"
    />
  </q-card-section>
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useCountryStore } from '../../../stores/country-store';

const store = useCountryStore();

// Auto fetch when search changes
watch(
  () => store.search,
  async () => {
    // Always reset to page 1 on new search
    await store.fetchCountries();
  },
);
</script>
