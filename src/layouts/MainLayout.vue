<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Top main menu -->
    <q-header elevated>
      <q-toolbar class="bg-primary text-white justify-start">
        <q-toolbar-title>Payroll App</q-toolbar-title>
        <div class="row items-center q-gutter-sm">
          <q-btn
            v-for="item in mainMenuItems"
            :key="item.id"
            flat
            dense
            no-caps
            @click="selectMenu(item)"
            :label="item.title"
            :icon="item.icon ?? undefined"
            :class="['menu-btn', selectedMenu?.id === item.id ? 'selected' : '']"
          />
        </div>
      </q-toolbar>
    </q-header>

    <!-- Side drawer for submenus -->
    <q-drawer v-model="drawerOpen" show-if-above bordered>
      <q-list>
        <MenuList v-if="selectedChildren.length" :items="selectedChildren" />
        <div v-else class="q-pa-md text-grey">No submenu</div>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useMenuStore, type MenuItem } from 'src/stores/menus';
import MenuList from 'src/components/Menu/MenuList.vue';

const menuStore = useMenuStore();
const drawerOpen = ref(false);
const selectedMenu = ref<MenuItem | null>(null);

onMounted(async () => {
  drawerOpen.value = false;
  await menuStore.fetchMenus();
});

// Only top-level menus (main menu)
const mainMenuItems = computed(() => menuStore.menuTree);

// Sub-menu for the selected main menu
const selectedChildren = computed(() => selectedMenu.value?.children || []);

function selectMenu(item: MenuItem) {
  selectedMenu.value = item;
  drawerOpen.value = item.children && item.children.length > 0;
}
</script>

<style scoped>
.menu-btn {
  color: white;
  opacity: 0.8;
  transition: all 0.2s ease;
}

.menu-btn:hover {
  opacity: 1;
}

.menu-btn.selected {
  background-color: white !important;
  color: var(--q-primary) !important;
  border-radius: 6px;
  font-weight: 600;
}
</style>
