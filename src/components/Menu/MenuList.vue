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
import { useRouter } from 'vue-router';
import type { MenuItem } from 'src/stores/menus';
import MenuList from './MenuList.vue';

defineProps<{ items: MenuItem[] }>();
defineOptions({ name: 'MenuList' });

const router = useRouter();

async function openGeneral(item: MenuItem) {
  const submenuString = JSON.stringify(item.children || []);
  await router.push({
    name: 'general-settings',
    state: { submenu: submenuString },
  });
}
</script>

<style scoped>
.menu-list {
  padding-left: 0.25rem;
  padding-top: 20px;
}

/* Styling for q-items */
.q-item {
  color: var(--q-color-grey-8);
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
  margin: 4px 8px 4px 4px;
  min-height: 40px;
}

.q-item:hover {
  background-color: var(--q-color-grey-2);
  color: var(--q-color-primary);
}

.q-item.q-router-link--active {
  background-color: var(--q-color-primary-light);
  color: var(--q-color-primary);
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}
</style>
