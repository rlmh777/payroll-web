import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export interface MenuItem {
  id: string;
  parent_id: string | null;
  title: string;
  route: string | null;
  icon: string | null;
  permission: string | null;
  order: number;
  is_active: boolean;
  type: string;
  children: MenuItem[];
  parent?: MenuItem | null;
}

export const useMenuStore = defineStore('menus', () => {
  const menuTree = ref<MenuItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  async function fetchMenus() {
    if (!authStore.token) return;

    loading.value = true;
    error.value = null;

    try {
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
    } catch (err: unknown) {
      console.error('Menu fetch error:', err);
      if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Error fetching menus';
      }
    } finally {
      loading.value = false;
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
  }

  const menus = computed<MenuItem[]>(() => flattenMenuTree(menuTree.value));

  return {
    menus,
    menuTree,
    loading,
    error,
    fetchMenus,
    clearMenus,
  };
});
