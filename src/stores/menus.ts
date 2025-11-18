import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { useAuthStore } from './auth';

const API_URL = process.env.API_URL || 'http://localhost:3031/api';

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
  const menus = ref<MenuItem[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  async function fetchMenus() {
    if (!authStore.token) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/menus`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch menus: ${response.statusText}`);
      }

      const data: MenuItem[] = await response.json();

      // Sort by order
      menus.value = data.sort((a, b) => a.order - b.order);
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

  function clearMenus() {
    menus.value = [];
  }

  // Computed menu tree for recursive display
  const menuTree = computed<MenuItem[]>(() => {
    const map = new Map<string, MenuItem>();
    menus.value.forEach((m) => map.set(m.id, { ...m, children: [] }));

    const tree: MenuItem[] = [];
    map.forEach((m) => {
      if (m.parent_id) {
        const parent = map.get(m.parent_id);
        if (parent) parent.children.push(m);
      } else {
        tree.push(m);
      }
    });
    return tree;
  });

  return {
    menus,
    loading,
    error,
    fetchMenus,
    clearMenus,
    menuTree, // <-- now available to your layout
  };
});
