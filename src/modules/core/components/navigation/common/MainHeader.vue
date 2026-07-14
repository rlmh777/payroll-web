<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar>
      <q-btn
        v-if="showDrawerToggle"
        flat
        dense
        round
        icon="menu"
        aria-label="Menu"
        @click="toggleDrawer"
      />

      <div class="row items-center q-gutter-sm" :class="showDrawerToggle ? 'q-ml-md' : ''">
        <template v-for="(item, idx) in topMenus" :key="item.id">
          <q-btn-dropdown
            v-if="item.children?.length"
            split
            flat
            dense
            :label="item.title"
            :icon="item.icon ?? undefined"
            :class="selectedTopId === item.id ? 'bg-white text-primary' : 'text-white'"
            menu-anchor="bottom start"
            menu-self="top start"
            content-class="employee-menu-dropdown"
            @click="openTopMenu(item)"
          >
            <q-list dense style="min-width: 200px">
              <q-item
                v-for="child in item.children"
                :key="child.id"
                clickable
                v-close-popup
                @click="openChildMenu(item, child)"
              >
                <q-item-section v-if="child.icon" avatar>
                  <q-icon :name="child.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ child.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            v-else
            flat
            dense
            :label="item.title"
            :icon="item.icon ?? undefined"
            :class="selectedTopId === item.id ? 'bg-white text-primary' : 'text-white'"
            @click="openTopMenu(item)"
          />

          <q-separator v-if="idx < topMenus.length - 1" vertical class="bg-white" />
        </template>
      </div>

      <q-space />

      <NotificationBell />
      <LogoutCard />
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import { findTopMenuForPath } from '../../../utils/menu-navigation';
import LogoutCard from '../common/LogoutCard.vue';
import NotificationBell from '../common/NotificationBell.vue';

withDefaults(
  defineProps<{
    showDrawerToggle?: boolean;
  }>(),
  {
    showDrawerToggle: true,
  },
);

const menuStore = useMenuStore();
const router = useRouter();
const route = useRoute();
const selectedTopId = ref<string | number | null>(null);

onMounted(async () => {
  if (!menuStore.menuTree.length) {
    await menuStore.fetchMenus();
  }
  syncSelectedTopFromRoute();
});

function syncSelectedTopFromRoute() {
  const match = findTopMenuForPath(route.path, menuStore.menuTree);
  if (match) {
    selectedTopId.value = match.id;
  }
}

watch(() => route.path, syncSelectedTopFromRoute, { immediate: true });

watch(
  () => menuStore.menuTree,
  () => {
    syncSelectedTopFromRoute();
  },
  { deep: true },
);

const topMenus = computed(() => menuStore.menuTree || []);

function openTopMenu(item: MenuItem) {
  selectedTopId.value = item.id ?? null;

  if (item.route) {
    void router.push(item.route);
  }

  window.dispatchEvent(new CustomEvent('open-menu', { detail: item.id }));
}

function openChildMenu(parent: MenuItem, child: MenuItem) {
  selectedTopId.value = parent.id ?? null;
  window.dispatchEvent(new CustomEvent('open-menu', { detail: parent.id }));

  if (child.route) {
    void router.push(child.route);
  }
}

function toggleDrawer() {
  window.dispatchEvent(new CustomEvent('toggle-drawer'));
}
</script>

<style scoped></style>
