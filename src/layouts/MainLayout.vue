<template>
  <q-layout view="lHh Lpr lFf">
    <!-- Top main menu -->
    <q-header elevated>
      <q-toolbar class="bg-primary text-white">
        <div class="row items-center q-gutter-sm">
          <!-- <q-toolbar-title> Logo </q-toolbar-title> -->
          <div class="row items-center q-gutter-sm justify-start">
            <q-btn
              v-for="(item, index) in mainMenuItems"
              :key="item.id"
              flat
              dense
              no-caps
              @click="selectMenu(item)"
              :label="item.title"
              :icon="item.icon ?? undefined"
              :class="[
                'menu-btn',
                selectedMenu?.id === item.id ? 'selected' : '',
                index < mainMenuItems.length - 1 ? 'separator' : '',
              ]"
            />
          </div>
        </div>
        <q-space />
        <!-- Logout / User Menu -->
        <q-btn flat round dense icon="account_circle">
          <q-menu transition-show="jump-down" transition-hide="jump-up">
            <q-card class="q-pa-sm" style="min-width: 180px">
              <q-card-section class="text-center">
                <q-avatar size="48px" class="bg-primary text-white">
                  <q-icon name="person" />
                </q-avatar>
                <div class="q-mt-sm text-weight-medium">{{ 'User' }}</div>
                <div class="text-caption text-grey">Logged in</div>
              </q-card-section>

              <q-separator />

              <q-card-actions align="around">
                <q-btn flat icon="logout" label="Logout" color="negative" />
              </q-card-actions>
            </q-card>
          </q-menu>
        </q-btn>
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

/* --- New Separator Style --- */
.menu-btn.separator {
  /* Adds a subtle white vertical line to the right of the button */
  border-right: 1px solid rgba(255, 255, 255, 0.4);
}

.menu-btn.selected.separator {
  /* Ensure the separator is visible even when selected, 
     but maybe match the theme or be clearer */
  border-right: 1px solid rgba(0, 0, 0, 0.2);
}
</style>
