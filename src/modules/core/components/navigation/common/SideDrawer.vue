<template>
  <q-drawer v-if="hasSideMenu" v-model="drawerOpen" show-if-above bordered side="left">
    <q-scroll-area class="drawer-scroll">
      <EmployeeLeftPane v-if="isEmployeeRoute" />
      <SchedulerLeftPane v-else-if="isSchedulerRoute" />
      <TimesheetLeftPane v-else-if="isTimesheetRoute" />
      <MenuList v-else-if="selectedChildren.length" :items="selectedChildren" />
    </q-scroll-area>
  </q-drawer>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import { findTopMenuForPath } from '../../../utils/menu-navigation';
import MenuList from '../../Menu/MenuList.vue';
import EmployeeLeftPane from '@hr/components/employee/search/EmployeeLeftPane.vue';
import SchedulerLeftPane from '@hr/components/settings/calendar/SchedulerLeftPane.vue';
import TimesheetLeftPane from '@hr/components/timesheet/TimesheetLeftPane.vue';
import { useEmployeeLeaveStore } from '@hr/stores/employee-leave-store';
import { MODULE_ROUTES, pathInModule } from '../../../config/module-routes';

const menuStore = useMenuStore();
const leaveStore = useEmployeeLeaveStore();
const route = useRoute();
const drawerOpen = ref(false);
const selectedMenu = ref<MenuItem | null>(null);

function isDrawerPaneRoute(path: string) {
  return (
    pathInModule(path, 'employees') ||
    pathInModule(path, 'scheduler') ||
    pathInModule(path, 'timesheet') ||
    pathInModule(path, 'leaves')
  );
}

function shouldOpenDrawerForMenu(item: MenuItem) {
  if (item.route && isDrawerPaneRoute(item.route)) {
    return true;
  }

  return Boolean(item.children && item.children.length);
}

function syncSelectedMenuFromRoute() {
  if (!menuStore.menuTree.length) {
    return;
  }

  const match = findTopMenuForPath(route.path, menuStore.menuTree);
  if (match) {
    selectedMenu.value = match;
    return;
  }

  if (!selectedMenu.value) {
    selectedMenu.value = menuStore.menuTree[0] ?? null;
  }
}

onMounted(async () => {
  if (!menuStore.menuTree.length) {
    await menuStore.fetchMenus();
  }

  await leaveStore.fetchTeamAccess();
  syncSelectedMenuFromRoute();

  window.addEventListener('open-menu', onOpenMenu as EventListener);
  window.addEventListener('toggle-drawer', onToggleDrawer as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('open-menu', onOpenMenu as EventListener);
  window.removeEventListener('toggle-drawer', onToggleDrawer as EventListener);
});

function onOpenMenu(e: Event) {
  const id = (e as CustomEvent).detail;
  const found = menuStore.menuTree.find((m) => m.id === id) ?? null;
  if (found) {
    selectedMenu.value = found;
    drawerOpen.value = shouldOpenDrawerForMenu(found);
  }
}

function onToggleDrawer() {
  drawerOpen.value = !drawerOpen.value;
}

watch(() => route.path, syncSelectedMenuFromRoute, { immediate: true });

watch(
  () => menuStore.menuTree,
  () => {
    syncSelectedMenuFromRoute();
  },
  { deep: true },
);

const isEmployeeRoute = computed(() => pathInModule(route.path, 'employees'));
const isSchedulerRoute = computed(() => pathInModule(route.path, 'scheduler'));
const isTimesheetRoute = computed(() => pathInModule(route.path, 'timesheet'));
const selectedChildren = computed(() => {
  const children = selectedMenu.value?.children || [];
  const isLeavesMenu =
    selectedMenu.value?.route === MODULE_ROUTES.leaves || selectedMenu.value?.title === 'Leaves';

  if (!isLeavesMenu || leaveStore.teamAccess?.canAccess) {
    return children;
  }

  return children.filter(
    (item) =>
      item.route !== `${MODULE_ROUTES.leaves}/list` &&
      item.route !== `${MODULE_ROUTES.leaves}/entitlement`,
  );
});
const hasSideMenu = computed(
  () =>
    isEmployeeRoute.value ||
    isSchedulerRoute.value ||
    isTimesheetRoute.value ||
    selectedChildren.value.length > 0,
);

watch(
  () => isDrawerPaneRoute(route.path),
  (shouldOpen) => {
    if (shouldOpen) {
      drawerOpen.value = true;
    }
  },
  { immediate: true },
);

watch(
  () => hasSideMenu.value,
  (hasMenu) => {
    if (!hasMenu) {
      drawerOpen.value = false;
    }
  },
);
</script>

<style scoped>
.drawer-scroll {
  height: 100%;
}
</style>
