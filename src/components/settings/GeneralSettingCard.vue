<template>
  <div class="row q-col-gutter-md q-pa-md q-pl-xl">
    <div v-if="!submenuItems.length" class="text-grey">No submenu items available.</div>

    <q-card
      v-for="(item, index) in submenuItems"
      :key="index"
      class="cursor-pointer q-pa-lg col-12 col-sm-6 col-md-2 q-mx-sm q-my-md hoverable"
      @click="goTo(item.route)"
    >
      <q-card-section class="text-center">
        <q-icon :name="item.icon || 'menu'" size="40px" color="primary" />
        <div class="text-subtitle1 q-mt-sm">{{ item.title }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore, type MenuItem } from 'src/stores/menus';
import { findGeneralSettingsMenu, isGeneralSettingsPath } from 'src/utils/menu-navigation';

const router = useRouter();
const route = useRoute();
const menuStore = useMenuStore();

const submenuItems = computed(() => {
  const generalMenu = findGeneralSettingsMenu(menuStore.menuTree);

  if (isGeneralSettingsPath(route.path, generalMenu) && generalMenu?.children?.length) {
    return generalMenu.children;
  }

  const historyState = window.history.state as { submenu?: string };
  if (!historyState?.submenu) {
    return [];
  }

  try {
    return JSON.parse(historyState.submenu) as MenuItem[];
  } catch (error) {
    console.error('Failed to parse submenu data from history state:', error);
    return [];
  }
});

onMounted(async () => {
  if (!menuStore.menuTree.length) {
    await menuStore.fetchMenus();
  }
});

function goTo(path?: string | null) {
  if (path)
    router.push(path).catch((err) => {
      console.error('Navigation error:', err);
    });
}
</script>

<style scoped></style>
