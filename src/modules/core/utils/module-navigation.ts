import type { MenuItem } from '../types/menu-item';
import { findTopMenuForPath } from './menu-navigation';

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
  const topMatch = findTopMenuForPath(path, menuTree);
  if (topMatch?.module_code) {
    return topMatch.module_code;
  }

  if (path.startsWith('/payroll')) {
    return 'payroll';
  }

  return 'payroll';
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
