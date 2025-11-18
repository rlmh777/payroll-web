<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <!-- Drawer Toggle -->
      <q-btn flat dense round icon="menu" aria-label="Menu" @click="toggleDrawer" />

      <!-- Top Menu Buttons -->
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

          <!-- Separator except after last element -->
          <q-separator v-if="idx < topMenus.length - 1" vertical class="bg-white" />
        </template>
      </div>

      <q-space />

      <!-- Logout -->
      <LogoutCard />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import LogoutCard from '../common/LogoutCard.vue';

const menuStore = useMenuStore();

onMounted(async () => {
  await menuStore.fetchMenus();
});

const topMenus = computed(() => menuStore.menuTree || []);

function openTopMenu(item: MenuItem) {
  window.dispatchEvent(new CustomEvent('open-menu', { detail: item.id }));
}

function toggleDrawer() {
  window.dispatchEvent(new CustomEvent('toggle-drawer'));
}
</script>

<style scoped></style>
