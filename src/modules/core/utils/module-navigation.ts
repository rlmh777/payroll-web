import type { MenuItem } from '../types/menu-item';

export interface AppModule {
  code: string;
  title: string;
  icon: string | null;
  default_route: string | null;
  is_core: boolean;
  enabled: boolean;
  sort_order: number;
  version?: string;
  config?: Record<string, unknown> | null;
}

export interface NavigationPayload {
  modules: AppModule[];
  launcher: AppModule[];
  menuTree: MenuItem[];
  moduleMenus: Record<string, MenuItem[]>;
}

const ACTIVE_MODULE_KEY = 'payroll-active-module';

export function getStoredActiveModule(): string | null {
  return sessionStorage.getItem(ACTIVE_MODULE_KEY);
}

export function storeActiveModule(code: string): void {
  sessionStorage.setItem(ACTIVE_MODULE_KEY, code);
}

export function resolveModuleForPath(
  path: string,
  menuTree: MenuItem[],
): string | null {
  const topMatch = menuTree.find((top) => menuContainsPath(top, path));
  if (topMatch?.module_code) {
    return topMatch.module_code;
  }

  if (path.startsWith('/payroll')) {
    return 'payroll';
  }

  return 'payroll';
}

function menuContainsPath(item: MenuItem, path: string): boolean {
  if (routeMatches(item.route, path)) {
    return true;
  }

  return item.children?.some((child) => menuContainsPath(child, path)) ?? false;
}

function routeMatches(menuRoute: string | null, path: string): boolean {
  if (!menuRoute) {
    return false;
  }

  if (menuRoute === '/') {
    return path === '/';
  }

  return path === menuRoute || path.startsWith(`${menuRoute}/`);
}

export function pickDefaultActiveModule(
  modules: AppModule[],
  path: string,
  menuTree: MenuItem[],
): string {
  const stored = getStoredActiveModule();
  if (stored && modules.some((module) => module.code === stored && module.enabled)) {
    return stored;
  }

  const fromPath = resolveModuleForPath(path, menuTree);
  if (fromPath && modules.some((module) => module.code === fromPath && module.enabled)) {
    return fromPath;
  }

  return modules.find((module) => module.enabled)?.code ?? 'payroll';
}
