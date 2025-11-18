<template>
  <q-drawer v-model="drawerOpen" show-if-above bordered side="left">
    <q-toolbar class="items-center">
      <q-btn flat dense round icon="chevron_left" @click="drawerOpen = false" />
      <q-toolbar-title>Sections</q-toolbar-title>
    </q-toolbar>

    <q-scroll-area style="height: calc(100% - 56px)">
      <MenuList v-if="selectedChildren.length" :items="selectedChildren" />
      <q-list v-else>
        <q-item>
          <q-item-section>No sections</q-item-section>
        </q-item>
      </q-list>
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import MenuList from '../../menu/MenuList.vue';

const menuStore = useMenuStore();
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
    drawerOpen.value = true;
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

const selectedChildren = computed(() => selectedMenu.value?.children || []);
</script>

<style scoped></style>
