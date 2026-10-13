import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMenuStore, type MenuItem } from '../stores/menus';
import { findTopMenuForPath } from '../utils/menu-navigation';
import { MODULE_ROUTES, pathInModule } from '../config/module-routes';
import { useEmployeeLeaveStore } from '@hr/stores/employee-leave-store';

export function isLeftDrawerPaneRoute(path: string): boolean {
  return (
    pathInModule(path, 'employees') ||
    pathInModule(path, 'scheduler') ||
    pathInModule(path, 'timesheet') ||
    pathInModule(path, 'reports')
  );
}

export function drawerChildrenForMenu(
  menu: MenuItem | null | undefined,
  canAccessLeaveTeam?: boolean | null,
): MenuItem[] {
  const children = menu?.children ?? [];
  const isLeavesMenu =
    menu?.route === MODULE_ROUTES.leaves || menu?.title === 'Leaves';

  if (!isLeavesMenu || canAccessLeaveTeam) {
    return children;
  }

  return children.filter(
    (item) =>
      item.route !== `${MODULE_ROUTES.leaves}/list` &&
      item.route !== `${MODULE_ROUTES.leaves}/entitlement`,
  );
}

export function menuHasLeftDrawer(
  path: string,
  menu: MenuItem | null | undefined,
  canAccessLeaveTeam?: boolean | null,
): boolean {
  if (isLeftDrawerPaneRoute(path)) {
    return true;
  }

  return drawerChildrenForMenu(menu, canAccessLeaveTeam).length > 0;
}

export function useHasLeftDrawer() {
  const route = useRoute();
  const menuStore = useMenuStore();
  const leaveStore = useEmployeeLeaveStore();

  const selectedTopMenu = computed(() =>
    findTopMenuForPath(route.path, menuStore.activeModuleMenus),
  );

  const hasLeftDrawer = computed(() =>
    menuHasLeftDrawer(route.path, selectedTopMenu.value, leaveStore.teamAccess?.canAccess),
  );

  return { hasLeftDrawer, selectedTopMenu };
}
