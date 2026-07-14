import { computed } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import { routeViewPermission } from '@core/utils/permissions';
import { isPathAllowedByMenus, collectMenuRoutes } from '@core/utils/menu-navigation';
import type { MenuItem } from '@core/stores/menus';

function resolveUserRoles(user: ReturnType<typeof useAuthStore>['user']): string[] {
  if (!user) {
    return [];
  }

  if (user.roles?.length) {
    return user.roles;
  }

  return user.role ? [user.role] : [];
}

export function usePermissions() {
  const authStore = useAuthStore();

  const permissions = computed(() => authStore.user?.permissions ?? []);
  const roles = computed(() => resolveUserRoles(authStore.user));

  function isSuperAdmin(): boolean {
    return roles.value.includes('super-admin');
  }

  function can(permission: string | null | undefined): boolean {
    if (!permission) {
      return true;
    }

    if (isSuperAdmin()) {
      return true;
    }

    return permissions.value.includes(permission);
  }

  function canAny(required: string[]): boolean {
    if (isSuperAdmin()) {
      return true;
    }

    return required.some((permission) => permissions.value.includes(permission));
  }

  function canAll(required: string[]): boolean {
    if (isSuperAdmin()) {
      return true;
    }

    return required.every((permission) => permissions.value.includes(permission));
  }

  function canAccessRoute(path: string, menuTree: MenuItem[] = []): boolean {
    if (isSuperAdmin()) {
      return true;
    }

    if (menuTree.length > 0 && isPathAllowedByMenus(path, collectMenuRoutes(menuTree))) {
      return true;
    }

    const required = routeViewPermission(path);
    return can(required);
  }

  return {
    permissions,
    roles,
    can,
    canAny,
    canAll,
    canAccessRoute,
    isSuperAdmin,
  };
}
