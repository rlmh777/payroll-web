<template>
  <q-drawer v-if="hasSideMenu" v-model="drawerOpen" show-if-above bordered side="left">
    <q-scroll-area style="height: calc(100% - 56px)">
      <EmployeeLeftPane v-if="isEmployeeRoute" />
      <MenuList v-if="selectedChildren.length && !isEmployeeRoute" :items="selectedChildren" />
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import MenuList from '../../menu/MenuList.vue';
import EmployeeLeftPane from '../../employee/search/EmployeeLeftPane.vue';

const menuStore = useMenuStore();
const route = useRoute();
const drawerOpen = ref(false);
const selectedMenu = ref<MenuItem | null>(null);

onMounted(async () => {
  await menuStore.fetchMenus();

  // default to first top-level menu if present (use null coalescing to avoid `undefined`)
  if (menuStore.menuTree && menuStore.menuTree.length) {
    selectedMenu.value = menuStore.menuTree[0] ?? null;
  }

  // listen for header clicks
  window.addEventListener('open-menu', onOpenMenu as EventListener);
  window.addEventListener('toggle-drawer', onToggleDrawer as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('open-menu', onOpenMenu as EventListener);
  window.removeEventListener('toggle-drawer', onToggleDrawer as EventListener);
});

function onOpenMenu(e: Event) {
  const id = (e as CustomEvent).detail;
  const found = menuStore.menuTree?.find((m) => m.id === id) ?? null;
  if (found) {
    selectedMenu.value = found;
    drawerOpen.value = Boolean(found.children && found.children.length);
  }
}

function onToggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

watch(
  () => menuStore.menuTree,
  (tree) => {
    if (!selectedMenu.value && tree?.length) {
      selectedMenu.value = tree[0] ?? null;
    }
  },
  { immediate: true },
);
const isEmployeeRoute = computed(() => route.path.startsWith('/employees'));
const selectedChildren = computed(() => selectedMenu.value?.children || []);
const hasSideMenu = computed(() => isEmployeeRoute.value || selectedChildren.value.length > 0);

watch(
  () => hasSideMenu.value,
  (hasMenu) => {
    if (!hasMenu) {
      drawerOpen.value = false;
    }
  },
);
</script>

<style scoped></style>
