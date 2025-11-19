<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />

      <div class="row items-center q-gutter-sm q-ml-md">
        <template v-for="(item, idx) in topMenus" :key="item.id">
          <q-btn
            flat
            dense
            :label="item.title"
            :icon="item.icon ?? undefined"
            class="text-white"
            @click="openTopMenu(item)"
          />

          <q-separator v-if="idx < topMenus.length - 1" vertical class="bg-white" />
        </template>
      </div>

      <q-space />

      <LogoutCard />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router'; // <-- Import the router
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import LogoutCard from '../common/LogoutCard.vue';

const menuStore = useMenuStore();
const router = useRouter(); // <-- Get the router instance

onMounted(async () => {
  await menuStore.fetchMenus();
});

const topMenus = computed(() => menuStore.menuTree || []);

function openTopMenu(item: MenuItem) {
  // Check if the item has a route property
  if (item.route) {
    // 1. Navigate to the route using Vue Router
    void router.push(item.route);
  } else {
    // 2. Fallback to the custom event if no route is defined (for sub-menus, etc.)
    window.dispatchEvent(new CustomEvent('open-menu', { detail: item.id }));
  }
}

function toggleDrawer() {
  window.dispatchEvent(new CustomEvent('toggle-drawer'));
}
</script>

<style scoped></style>
