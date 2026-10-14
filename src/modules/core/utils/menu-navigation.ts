import type { MenuItem } from '../types/menu-item';

function routeMatches(menuRoute: string | null, path: string): boolean {
  if (!menuRoute) {
    return false;
  }

  if (menuRoute === '/') {
    return path === '/';
  }

  return path === menuRoute || path.startsWith(`${menuRoute}/`);
}

function menuContainsPath(item: MenuItem, path: string): boolean {
  if (routeMatches(item.route, path)) {
    return true;
  }

  return item.children?.some((child) => menuContainsPath(child, path)) ?? false;
}

export function collectMenuRoutes(items: MenuItem[]): string[] {
  const routes = new Set<string>();

  function walk(nodes: MenuItem[]) {
    for (const node of nodes) {
      if (node.route) {
        routes.add(node.route);
      }

      if (node.children?.length) {
        walk(node.children);
      }
    }
  }

  walk(items);

  return [...routes];
}

export type NavigableMenuOption = {
  label: string;
  value: string;
};

export function collectNavigableMenuOptions(items: MenuItem[], ancestors: string[] = []): NavigableMenuOption[] {
  const options: NavigableMenuOption[] = [];
  const seen = new Set<string>();

  function walk(nodes: MenuItem[], trail: string[]) {
    for (const node of nodes) {
      const nextTrail = [...trail, node.title];
      const route = node.route?.trim();
      if (route && !seen.has(route)) {
        seen.add(route);
        options.push({ label: nextTrail.join(' / '), value: route });
      }
      if (node.children?.length) {
        walk(node.children, nextTrail);
      }
    }
  }

  walk(items, ancestors);

  return options;
}

export function pickAccessibleApplicationCode(
  preferred: string | null | undefined,
  applications: Array<{ code: string }>,
  moduleMenus?: Record<string, MenuItem[]>,
): string {
  const accessible = applications.filter((app) => {
    if (!moduleMenus || !Object.keys(moduleMenus).length) {
      return true;
    }

    return (moduleMenus[app.code]?.length ?? 0) > 0;
  });
  const list = accessible.length ? accessible : applications;
  const requested = preferred && preferred !== '' ? preferred : 'payroll';
  if (list.some((app) => app.code === requested)) {
    return requested;
  }

  return list[0]?.code ?? requested;
}

export function resolvePreferredLandingPath(
  defaultModule: string | null | undefined,
  defaultMenu: string | null | undefined,
  enabledModules: Array<{ code: string; default_route: string | null }>,
  moduleMenus: Record<string, MenuItem[]>,
): string {
  const code = pickAccessibleApplicationCode(defaultModule, enabledModules, moduleMenus);
  const options = collectNavigableMenuOptions(moduleMenus[code] ?? []);
  if (defaultMenu && options.some((item) => item.value === defaultMenu)) {
    return defaultMenu;
  }

  const module = enabledModules.find((item) => item.code === code);
  return module?.default_route || '/';
}

export function isPathAllowedByMenus(path: string, menuRoutes: string[]): boolean {
  return menuRoutes.some((menuRoute) => routeMatches(menuRoute, path));
}

export function findTopMenuForPath(path: string, tree: MenuItem[]): MenuItem | null {
  let bestMatch: MenuItem | null = null;
  let bestRouteLength = -1;

  for (const top of tree) {
    if (!menuContainsPath(top, path)) {
      continue;
    }

    const routeLength = top.route?.length ?? 0;
    if (routeLength > bestRouteLength) {
      bestMatch = top;
      bestRouteLength = routeLength;
    }
  }

  return bestMatch;
}

export function findMenuBySystemKey(tree: MenuItem[], systemKey: string): MenuItem | null {
  for (const item of tree) {
    if (item.system_key === systemKey) {
      return item;
    }

    if (item.children?.length) {
      const nested = findMenuBySystemKey(item.children, systemKey);
      if (nested) {
        return nested;
      }
    }
  }

  return null;
}

export function findSettingsMenu(tree: MenuItem[]): MenuItem | null {
  return (
    tree.find(
      (item) =>
        item.route === '/payroll/settings' ||
        item.system_key === 'payroll.settings' ||
        (item.title === 'Settings' && item.module_code === 'payroll'),
    ) ?? null
  );
}

export function findGeneralSettingsMenu(tree: MenuItem[]): MenuItem | null {
  const settingsMenu = findSettingsMenu(tree);
  return settingsMenu?.children?.find((item) => item.title === 'General') ?? null;
}

export function isGeneralSettingsPath(path: string, generalMenu: MenuItem | null): boolean {
  if (path === '/payroll/settings' || path === '/settings') {
    return true;
  }

  if (!generalMenu?.children?.length) {
    return false;
  }

  return generalMenu.children.some(
    (child) => child.route && routeMatches(child.route, path),
  );
}
