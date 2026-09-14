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

export function clearStoredActiveModule(): void {
  sessionStorage.removeItem(ACTIVE_MODULE_KEY);
}

export function resolveModuleForPath(
  path: string,
  menuTree: MenuItem[],
): string | null {
  const topMatch = findTopMenuForPath(path, menuTree);
  if (topMatch?.module_code) {
    return topMatch.module_code;
  }

  if (path === '/' || path.startsWith('/payroll')) {
    return 'payroll';
  }

  if (path.startsWith('/hr/')) {
    return 'hr';
  }

  if (path.startsWith('/admin/')) {
    return 'admin';
  }

  if (path.startsWith('/core/')) {
    return 'core';
  }

  return null;
}

export function pickDefaultActiveModule(
  modules: AppModule[],
  path: string,
  menuTree: MenuItem[],
  preferredModule?: string | null,
): string {
  const isEnabled = (code: string | null | undefined) =>
    !!code && modules.some((module) => module.code === code && module.enabled);

  // Deep links win so shared URLs open the correct application.
  const fromPath = resolveModuleForPath(path, menuTree);
  if (path !== '/' && isEnabled(fromPath)) {
    return fromPath!;
  }

  if (isEnabled(preferredModule)) {
    return preferredModule!;
  }

  const stored = getStoredActiveModule();
  if (isEnabled(stored)) {
    return stored!;
  }

  if (isEnabled(fromPath)) {
    return fromPath!;
  }

  return modules.find((module) => module.enabled)?.code ?? 'payroll';
}
