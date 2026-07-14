<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <SearchMenus />
      <q-card-section class="q-pa-none">
        <ViewMenus />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useMenuStore } from '../../stores/menu-store';
import SearchMenus from './SearchMenus.vue';
import ViewMenus from './ViewMenus.vue';

const menuStore = useMenuStore();

onMounted(async () => {
  // Fetch menus on mount
  await menuStore.fetchMenus();
});
</script>

<style scoped>
</style>

