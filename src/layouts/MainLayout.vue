<template>
  <q-layout view="hHh Lpr lFf">
    <!-- Top main menu -->
    <MainHeader />
    <!-- Side drawer -->
    <SideDrawer />
    <q-page-container class="q-ma-md">
      <div class="q-px-md q-pt-sm breadcrumb-wrap">
        <q-breadcrumbs>
          <q-breadcrumbs-el
            v-for="crumb in breadcrumbs"
            :key="crumb.path"
            :label="crumb.label"
            :to="crumb.path"
          />
        </q-breadcrumbs>
      </div>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import MainHeader from 'src/components/navigation/common/MainHeader.vue';
import SideDrawer from 'src/components/navigation/common/SideDrawer.vue';
import { useMenuStore, type MenuItem } from 'src/stores/menus';

const route = useRoute();
const menuStore = useMenuStore();

onMounted(async () => {
  if (!menuStore.menuTree?.length) {
    await menuStore.fetchMenus();
  }
});

function flattenMenus(items: MenuItem[], list: MenuItem[] = []): MenuItem[] {
  items.forEach((item) => {
    list.push(item);
    if (item.children?.length) {
      flattenMenus(item.children, list);
    }
  });
  return list;
}

const breadcrumbs = computed(() => {
  const segments = route.path.split('/').filter(Boolean);
  const crumbs: Array<{ label: string; path: string }> = [];
  let currentPath = '';
  const menuItems = menuStore.menuTree ? flattenMenus(menuStore.menuTree) : [];

  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const menuMatch = menuItems.find((item) => item.route === currentPath);
    const label = menuMatch?.title
      ? menuMatch.title
      : segment
          .replace(/-/g, ' ')
          .replace(/\b\w/g, (match) => match.toUpperCase());
    crumbs.push({ label, path: currentPath });
  });

  return crumbs;
});
</script>

<style scoped>
.breadcrumb-wrap {
  min-height: 32px;
}
</style>
