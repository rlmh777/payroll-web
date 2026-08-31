import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';
import {
  getStoredActiveModule,
  resolveModuleForPath,
  storeActiveModule,
  type AppModule,
  type NavigationPayload,
} from '../utils/module-navigation';
import type { MenuItem } from '../types/menu-item';

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
    modules.value = data.modules ?? [];
    launcher.value =
      data.launcher?.length
        ? data.launcher
        : (data.modules ?? []).filter((module) => module.enabled);
    activeModule.value = activeModule.value ?? 'payroll';
  }

  function setActiveModule(code: string) {
    activeModule.value = code;
    storeActiveModule(code);
  }

  function syncActiveModuleFromPath(path: string) {
    if (!modules.value.length) {
      return;
    }

    const resolved = resolveModuleForPath(path, menuTree.value);
    if (resolved && modules.value.some((module) => module.code === resolved && module.enabled)) {
      setActiveModule(resolved);
    }
  }

  function normalizeMenuTree(items: MenuItem[], parentId: string | null = null): MenuItem[] {
    return items
      .map((item) => ({
        ...item,
        parent_id: item.parent_id ?? parentId,
        children: normalizeMenuTree(item.children ?? [], item.id),
      }))
      .sort((a, b) => a.order - b.order);
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

  function clearMenus() {
    menuTree.value = [];
    moduleMenus.value = {};
    modules.value = [];
    launcher.value = [];
    activeModule.value = null;
  }

  const menus = computed<MenuItem[]>(() => flattenMenuTree(menuTree.value));

  const activeModuleMenus = computed<MenuItem[]>(() => menuTree.value);

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
    setActiveModule,
    syncActiveModuleFromPath,
    clearMenus,
  };
});
