import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import {
  getStoredActiveModule,
  pickDefaultActiveModule,
  resolveModuleForPath,
  storeActiveModule,
  clearStoredActiveModule,
  type AppModule,
  type NavigationPayload,
} from '../utils/module-navigation';
import type { MenuItem } from '../types/menu-item';
import type { Menu as AdminMenu } from './menu-store';

export type { MenuItem } from '../types/menu-item';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export const useMenuStore = defineStore('menus', () => {
  const menuTree = ref<MenuItem[]>([]);
  const moduleMenus = ref<Record<string, MenuItem[]>>({});
  const modules = ref<AppModule[]>([]);
  const launcher = ref<AppModule[]>([]);
  const activeModule = ref<string | null>(getStoredActiveModule());
  const loading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  async function fetchMenus() {
    if (!authStore.token) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/session/navigation`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch navigation: ${response.statusText}`);
      }

      const data: NavigationPayload = await response.json();
      applyNavigation(data);
    } catch (err: unknown) {
      console.error('Navigation fetch error:', err);
      await fetchMenusLegacy();
    } finally {
      loading.value = false;
    }
  }

  async function fetchMenusLegacy() {
    const response = await fetch(`${API_URL}/user/menus`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch menus: ${response.statusText}`);
    }

    const data: MenuItem[] = await response.json();
    menuTree.value = normalizeMenuTree(data);
    moduleMenus.value = {};
    modules.value = [];
    launcher.value = [];
  }

  function applyNavigation(data: NavigationPayload) {
    menuTree.value = normalizeMenuTree(data.menuTree ?? []);
    moduleMenus.value = Object.fromEntries(
      Object.entries(data.moduleMenus ?? {}).map(([code, items]) => [
        code,
        normalizeMenuTree(items),
      ]),
    );
    const withoutCore = (list: AppModule[]) => list.filter((module) => module.code !== 'core');
    modules.value = withoutCore(data.modules ?? []);
    const rawLauncher = withoutCore(
      data.launcher?.length
        ? data.launcher
        : (data.modules ?? []).filter((module) => module.enabled),
    );
    launcher.value = rawLauncher.filter(
      (module) => (moduleMenus.value[module.code]?.length ?? 0) > 0,
    );

    const preferredModule = authStore.user?.preferences?.defaultModule ?? 'payroll';
    const nextActive = pickDefaultActiveModule(
      modules.value,
      typeof window !== 'undefined' ? window.location.pathname : '/',
      menuTree.value,
      preferredModule,
      moduleMenus.value,
    );
    activeModule.value = nextActive;
    storeActiveModule(nextActive);
  }

  function setActiveModule(code: string) {
    activeModule.value = code;
    storeActiveModule(code);
  }

  function syncActiveModuleFromPath(path: string) {
    if (!modules.value.length) {
      return;
    }

    const resolved = resolveModuleForPath(path, menuTree.value, {
      preferredModule: activeModule.value,
      moduleMenus: moduleMenus.value,
    });
    if (resolved && modules.value.some((module) => module.code === resolved && module.enabled)) {
      setActiveModule(resolved);
    }
  }

  function normalizeMenuTree(items: MenuItem[], parentId: string | null = null): MenuItem[] {
    return sortNavigationTree(items.map((item) => normalizeMenuNode(item, parentId)));
  }

  function toNavigationItem(menu: AdminMenu): MenuItem {
    const item: MenuItem = {
      id: menu.id,
      parent_id: menu.parent_id ?? null,
      title: menu.title,
      route: menu.route ?? null,
      icon: menu.icon ?? null,
      permission: menu.permission ?? null,
      order: menu.order ?? 0,
      is_active: menu.is_active ?? true,
      type: menu.type ?? 'menu',
      children: (menu.children ?? []).map((child) => toNavigationItem(child)),
    };

    if (menu.module_code !== undefined) {
      item.module_code = menu.module_code;
    }
    if (menu.source !== undefined) {
      item.source = menu.source;
    }
    if (menu.system_key !== undefined) {
      item.system_key = menu.system_key;
    }

    return normalizeMenuNode(item);
  }

  function normalizeMenuNode(item: MenuItem, parentId: string | null = null): MenuItem {
    return {
      ...item,
      parent_id: item.parent_id ?? parentId,
      order: item.order ?? 0,
      children: normalizeMenuTree(item.children ?? [], item.id),
    };
  }

  function sortNavigationTree(items: MenuItem[]): MenuItem[] {
    return [...items]
      .sort((left, right) => left.order - right.order || left.title.localeCompare(right.title))
      .map((item) => ({
        ...item,
        children: sortNavigationTree(item.children ?? []),
      }));
  }

  function removeMenuById(items: MenuItem[], id: string): MenuItem[] {
    return items
      .filter((item) => item.id !== id)
      .map((item) => ({
        ...item,
        children: removeMenuById(item.children ?? [], id),
      }));
  }

  function placeMenu(items: MenuItem[], menu: MenuItem): MenuItem[] {
    if (!menu.parent_id) {
      return sortNavigationTree([...items.filter((item) => item.id !== menu.id), menu]);
    }

    return sortNavigationTree(items.map((item) => {
      if (item.id === menu.parent_id) {
        return {
          ...item,
          children: sortNavigationTree([
            ...(item.children ?? []).filter((child) => child.id !== menu.id),
            menu,
          ]),
        };
      }

      return {
        ...item,
        children: placeMenu(item.children ?? [], menu),
      };
    }));
  }

  function applyOrder(items: MenuItem[], orderById: Map<string, number>): MenuItem[] {
    return items.map((item) => ({
      ...item,
      order: orderById.get(item.id) ?? item.order,
      children: applyOrder(item.children ?? [], orderById),
    }));
  }

  function flattenMenuTree(items: MenuItem[], parentId: string | null = null): MenuItem[] {
    const flat: MenuItem[] = [];

    for (const item of items) {
      flat.push({
        ...item,
        parent_id: item.parent_id ?? parentId,
        children: [],
      });

      if (item.children?.length) {
        flat.push(...flattenMenuTree(item.children, item.id));
      }
    }

    return flat;
  }

  function applyMenuUpdate(menu: AdminMenu) {
    const item = toNavigationItem(menu);
    menuTree.value = placeMenu(removeMenuById(menuTree.value, item.id), item);
    const nextModules = { ...moduleMenus.value };

    for (const code of Object.keys(nextModules)) {
      nextModules[code] = removeMenuById(nextModules[code] ?? [], item.id);
    }

    const moduleCode = item.module_code;
    if (moduleCode && Object.prototype.hasOwnProperty.call(nextModules, moduleCode)) {
      nextModules[moduleCode] = placeMenu(nextModules[moduleCode] ?? [], item);
    }

    moduleMenus.value = nextModules;
  }

  function applyMenuOrder(items: { id: string; order: number }[]) {
    const orderById = new Map(items.map((item) => [item.id, item.order]));
    menuTree.value = sortNavigationTree(applyOrder(menuTree.value, orderById));
    moduleMenus.value = Object.fromEntries(
      Object.entries(moduleMenus.value).map(([code, tree]) => [
        code,
        sortNavigationTree(applyOrder(tree, orderById)),
      ]),
    );
  }

  function removeNavigationMenu(id: string) {
    menuTree.value = removeMenuById(menuTree.value, id);
    moduleMenus.value = Object.fromEntries(
      Object.entries(moduleMenus.value).map(([code, tree]) => [code, removeMenuById(tree, id)]),
    );
  }

  function clearMenus() {
    menuTree.value = [];
    moduleMenus.value = {};
    modules.value = [];
    launcher.value = [];
    activeModule.value = null;
    clearStoredActiveModule();
  }

  const menus = computed<MenuItem[]>(() => flattenMenuTree(menuTree.value));

  const activeModuleMenus = computed<MenuItem[]>(() => {
    const code = activeModule.value;
    if (code && moduleMenus.value[code]?.length) {
      return moduleMenus.value[code];
    }

    // Legacy / single-module fallback: show the full tree.
    if (!Object.keys(moduleMenus.value).length) {
      return menuTree.value;
    }

    return code ? (moduleMenus.value[code] ?? []) : menuTree.value;
  });

  const enabledModules = computed(() => modules.value.filter((module) => module.enabled));

  return {
    menus,
    menuTree,
    moduleMenus,
    modules,
    launcher,
    activeModule,
    activeModuleMenus,
    enabledModules,
    loading,
    error,
    fetchMenus,
    applyMenuUpdate,
    applyMenuOrder,
    removeNavigationMenu,
    setActiveModule,
    syncActiveModuleFromPath,
    clearMenus,
  };
});
