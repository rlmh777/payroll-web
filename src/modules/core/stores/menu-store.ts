import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface Menu {
  id: string;
  parent_id?: string | null;
  title: string;
  route?: string | null;
  icon?: string | null;
  permission?: string | null;
  order?: number;
  is_active?: boolean;
  type?: string;
  module_code?: string | null;
  source?: string | null;
  system_key?: string | null;
  parent?: Menu | null;
  children?: Menu[];
}

export const DEFAULT_MENU_MODULE = 'payroll';

interface ApiErrorData {
  error?: string;
  errors?: Record<string, string[] | string>;
  [key: string]: unknown;
}

interface CreateMenuBody {
  parent_id?: string | null;
  title: string;
  route?: string | null;
  icon?: string | null;
  permission?: string | null;
  order?: number;
  is_active?: boolean;
  type?: string;
  module_code?: string | null;
}

interface UpdateMenuBody {
  parent_id?: string | null;
  title?: string;
  route?: string | null;
  icon?: string | null;
  permission?: string | null;
  order?: number;
  is_active?: boolean;
  type?: string;
  module_code?: string | null;
}

export const useMenuStore = defineStore('menu', {
  state: () => ({
    menus: [] as Menu[],
    isLoading: false,
    isLoadingMenus: false,
    error: null as string | null,
    searchFilters: {
      search: null as string | null,
      type: null as string | null,
      parent_id: null as string | null,
      is_active: null as boolean | null,
      module_code: null as string | null,
    },
  }),

  getters: {
    rootMenus: (state): Menu[] => {
      return state.menus.filter(menu => !menu.parent_id);
    },
    menusByParent: (state): Record<string, Menu[]> => {
      const grouped: Record<string, Menu[]> = {};
      state.menus.forEach(menu => {
        const parentId = menu.parent_id || 'root';
        if (!grouped[parentId]) {
          grouped[parentId] = [];
        }
        grouped[parentId].push(menu);
      });
      return grouped;
    },
  },

  actions: {
    async fetchMenus() {
      if (this.isLoadingMenus) return;

      this.isLoadingMenus = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const queryParams = new URLSearchParams();

        if (this.searchFilters.type) {
          queryParams.append('type', this.searchFilters.type);
        }
        if (this.searchFilters.parent_id !== null) {
          queryParams.append('parent_id', this.searchFilters.parent_id || 'null');
        }
        if (this.searchFilters.is_active !== null) {
          queryParams.append('is_active', this.searchFilters.is_active.toString());
        }
        if (this.searchFilters.module_code) {
          queryParams.append('module_code', this.searchFilters.module_code);
        }

        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const url = queryParams.toString()
          ? `${API_URL}/menus?${queryParams.toString()}`
          : `${API_URL}/menus`;

        const response = await fetch(url, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch menus: ${response.statusText}`);
        }

        const data = await response.json();
        this.menus = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error fetching menus:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching menus';
      } finally {
        this.isLoadingMenus = false;
      }
    },

    async fetchMenu(id: string): Promise<Menu | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/menus/${id}`, {
          headers,
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch menu: ${response.statusText}`);
        }

        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Error fetching menu:', error);
        this.error = error instanceof Error ? error.message : 'Error fetching menu';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async createMenu(
      title: string,
      parent_id?: string | null,
      route?: string | null,
      icon?: string | null,
      permission?: string | null,
      order?: number,
      is_active?: boolean,
      type?: string,
      module_code?: string | null,
    ): Promise<Menu | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const body: CreateMenuBody = { title };
        if (parent_id !== undefined) body.parent_id = parent_id;
        if (route !== undefined) body.route = route;
        if (icon !== undefined) body.icon = icon;
        if (permission !== undefined) body.permission = permission;
        if (order !== undefined) body.order = order;
        if (is_active !== undefined) body.is_active = is_active;
        if (type !== undefined) body.type = type;
        body.module_code = module_code ?? DEFAULT_MENU_MODULE;

        const response = await fetch(`${API_URL}/menus`, {
          method: 'POST',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to create menu: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const newMenu = result.data || result;

        this.menus = [...this.menus, newMenu];
        return newMenu;
      } catch (error) {
        console.error('Error creating menu:', error);
        this.error = error instanceof Error ? error.message : 'Error creating menu';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateMenu(
      id: string,
      title?: string,
      parent_id?: string | null,
      route?: string | null,
      icon?: string | null,
      permission?: string | null,
      order?: number,
      is_active?: boolean,
      type?: string,
      module_code?: string | null,
    ): Promise<Menu | null> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const body: UpdateMenuBody = {};
        if (title !== undefined) body.title = title;
        if (parent_id !== undefined) body.parent_id = parent_id;
        if (route !== undefined) body.route = route;
        if (icon !== undefined) body.icon = icon;
        if (permission !== undefined) body.permission = permission;
        if (order !== undefined) body.order = order;
        if (is_active !== undefined) body.is_active = is_active;
        if (type !== undefined) body.type = type;
        if (module_code !== undefined) body.module_code = module_code;

        const response = await fetch(`${API_URL}/menus/${id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const errorData: ApiErrorData = await response.json().catch(() => ({}));
          let errorMessage = errorData.error || `Failed to update menu: ${response.statusText}`;
          if (errorData.errors) {
            const errorKeys = Object.keys(errorData.errors);
            if (errorKeys.length > 0 && errorKeys[0]) {
              const firstErrorKey = errorKeys[0];
              const firstError = errorData.errors[firstErrorKey];
              if (Array.isArray(firstError) && firstError[0]) {
                errorMessage = firstError[0];
              } else if (typeof firstError === 'string') {
                errorMessage = firstError;
              }
            }
          }
          throw new Error(errorMessage);
        }

        const result = await response.json();
        const updatedMenu = result.data || result;

        const index = this.menus.findIndex((m) => m.id === id);
        if (index !== -1) {
          this.menus[index] = updatedMenu;
        }

        return updatedMenu;
      } catch (error) {
        console.error('Error updating menu:', error);
        this.error = error instanceof Error ? error.message : 'Error updating menu';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async deleteMenu(id: string): Promise<boolean> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };

        if (authStore.token) {
          headers['Authorization'] = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/menus/${id}`, {
          method: 'DELETE',
          headers,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || errorData.error || `Failed to delete menu: ${response.statusText}`);
        }

        this.menus = this.menus.filter((m) => m.id !== id);
        return true;
      } catch (error) {
        console.error('Error deleting menu:', error);
        this.error = error instanceof Error ? error.message : 'Error deleting menu';
        return false;
      } finally {
        this.isLoading = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMenuStore, import.meta.hot));
}

