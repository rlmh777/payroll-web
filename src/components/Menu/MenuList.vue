<template>
  <q-list class="menu-list">
    <template v-for="item in items" :key="item.id">
      <q-expansion-item
        v-if="item.children && item.children.length > 0"
        :icon="item.icon || 'folder'"
        :label="item.title"
        expand-separator
        dense
      >
        <MenuList :items="item.children" />
      </q-expansion-item>

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
import { defineProps } from 'vue';
import type { MenuItem } from 'src/stores/menus';
import MenuList from './MenuList.vue';

defineProps<{
  items: MenuItem[];
}>();

// Recursive component needs a name
defineOptions({ name: 'MenuList' });
</script>
<style scoped>
.menu-list {
  padding-left: 0.25rem;
  padding-top: 20px;
}

/* Style for individual side menu items (q-item) */
.q-item {
  color: var(--q-color-grey-8); /* Light grey text */
  border-radius: 4px;
  transition: all 0.2s ease-in-out;
  margin: 4px 8px 4px 4px; /* Space above/below and on the right */
  min-height: 40px; /* Ensure sufficient height for clicking */
}

/* Hover state for better interaction feedback */
.q-item:hover {
  background-color: var(--q-color-grey-2); /* Very light grey background on hover */
  color: var(--q-color-primary); /* Primary color text on hover */
}

/* Active/Selected state for the menu item */
/* We target the Quasar class 'q-router-link--active' for the currently selected route */
.q-item.q-router-link--active,
.q-item.q-router-link--active:hover {
  background-color: var(--q-color-primary-light); /* Light blue background */
  color: var(--q-color-primary); /* Primary blue text */
  font-weight: 600;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1); /* Subtle shadow for depth */
}

/* Styling for Expansion Items (for submenus, if you use them) */
.q-expansion-item {
  margin: 4px 0;
  border-radius: 4px;
}

/* Adjust the padding for nested items */
.q-item {
  padding-left: 12px; /* Base padding */
}

/* Increase padding for nested items that are direct children of the list */
.q-list > .q-item {
  padding-left: 12px;
}
</style>
