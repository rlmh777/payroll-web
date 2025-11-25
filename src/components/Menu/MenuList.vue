<template>
  <q-list class="menu-list">
    <template v-for="item in items" :key="item.id">
      <!-- Expandable menus (except General) -->
      <q-expansion-item
        v-if="item.children && item.children.length > 0 && item.title !== 'General'"
        :icon="item.icon || 'folder'"
        :label="item.title"
        expand-separator
        dense
      >
        <MenuList :items="item.children" />
      </q-expansion-item>

      <!-- Special handling for General -->
      <q-item
        v-else-if="item.children && item.title === 'General'"
        clickable
        dense
        class="q-ml-sm"
        :class="isActive(item) ? 'bg-primary text-white' : ''"
        @click="openGeneral(item)"
      >
        <q-item-section avatar>
          <q-icon :name="item.icon || 'settings'" />
        </q-item-section>
        <q-item-section>{{ item.title }}</q-item-section>
      </q-item>

      <!-- Leaf items (no children) -->
      <q-item v-else clickable :to="item.route" dense class="q-ml-sm">
        <q-item-section avatar>
          <q-icon :name="item.icon || 'menu'" />
        </q-item-section>
        <q-item-section>{{ item.title }}</q-item-section>
      </q-item>
    </template>
  </q-list>
</template>

<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import type { MenuItem } from 'src/stores/menus';

defineProps<{ items: MenuItem[] }>();

const router = useRouter();
const route = useRoute();

async function openGeneral(item: MenuItem) {
  const submenuString = JSON.stringify(item.children || []);
  await router.push({
    name: 'general-settings',
    state: { submenu: submenuString },
  });
}

/**
 * Returns true when the item (or any of its descendants) matches the current route.
 */
function isActive(item: MenuItem): boolean {
  if (item.route) {
    // exact match or route is a prefix of current path
    try {
      return route.path === item.route || route.path.startsWith(String(item.route));
    } catch {
      return false;
    }
  }
  if (item.children && item.children.length) {
    return item.children.some((c) => isActive(c));
  }
  return false;
}
</script>

<style scoped></style>
