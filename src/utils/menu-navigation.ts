import type { MenuItem } from '../stores/menus';

function routeMatches(menuRoute: string | null, path: string): boolean {
  if (!menuRoute) {
    return false;
  }

  return path === menuRoute || path.startsWith(`${menuRoute}/`);
}

function menuContainsPath(item: MenuItem, path: string): boolean {
  if (routeMatches(item.route, path)) {
    return true;
  }

  return item.children?.some((child) => menuContainsPath(child, path)) ?? false;
}

export function findTopMenuForPath(path: string, tree: MenuItem[]): MenuItem | null {
  return tree.find((top) => menuContainsPath(top, path)) ?? null;
}

export function findSettingsMenu(tree: MenuItem[]): MenuItem | null {
  return tree.find((item) => item.route === '/settings' || item.title === 'Settings') ?? null;
}

export function findGeneralSettingsMenu(tree: MenuItem[]): MenuItem | null {
  const settingsMenu = findSettingsMenu(tree);
  return settingsMenu?.children?.find((item) => item.title === 'General') ?? null;
}

export function isGeneralSettingsPath(path: string, generalMenu: MenuItem | null): boolean {
  if (path === '/settings') {
    return true;
  }

  if (!generalMenu?.children?.length) {
    return false;
  }

  return generalMenu.children.some(
    (child) => child.route && routeMatches(child.route, path),
  );
}
