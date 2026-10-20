import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import { useMenuStore } from '@core/stores/menus';
import { useFormAssignmentStore } from '@hr/stores/form-assignment-store';
import { moduleLandingPath, resolvePreferredLandingPath } from '@core/utils/menu-navigation';
import { resolveModuleForPath } from '@core/utils/module-navigation';
import { hasRoutePermission, routeViewPermission } from '@core/utils/permissions';
import routes from './routes';

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default route(function (/* { store } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : (process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory);

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  });

  const authStore = useAuthStore();
  const menuStore = useMenuStore();

  function canAccessPath(path: string): boolean {
    const requiredPermission = routeViewPermission(path);
    if (requiredPermission) {
      return hasRoutePermission(authStore.user?.permissions ?? [], requiredPermission);
    }

    return true;
  }

  function adminLandingPath(): string | null {
    const landing = moduleLandingPath('/admin/settings', menuStore.moduleMenus.admin ?? []);
    if (!landing || landing === '/admin/settings' || !canAccessPath(landing)) {
      return null;
    }

    return landing;
  }

  authStore.setUnauthorizedHandler((redirectPath) => {
    const target = redirectPath && redirectPath !== '/login'
      ? { path: '/login', query: { redirect: redirectPath, reason: 'session-expired' } }
      : { path: '/login', query: { reason: 'session-expired' } };

    void Router.push(target);
  });

  Router.beforeEach(async (to) => {
    authStore.checkAuth();

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!authStore.isAuthenticated) {
        return {
          path: '/login',
          query: { redirect: to.fullPath },
        };
      }

      const isValid = await authStore.ensureHydratedPermissions();
      if (!isValid) {
        return {
          path: '/login',
          query: { redirect: to.fullPath, reason: 'session-expired' },
        };
      }

      if (!menuStore.menuTree.length && authStore.token) {
        await menuStore.fetchMenus();
      }

      menuStore.syncActiveModuleFromPath(to.path);

      // Escape hatch: Modules settings must stay reachable so apps can be re-enabled.
      const isModulesSettings =
        to.path === '/admin/settings/modules' || to.path.startsWith('/admin/settings/modules/');
      const pathModule = resolveModuleForPath(to.path, menuStore.menuTree, {
        preferredModule: menuStore.activeModule,
        moduleMenus: menuStore.moduleMenus,
      });
      if (
        !isModulesSettings &&
        pathModule &&
        menuStore.modules.some((module) => module.code === pathModule && !module.enabled)
      ) {
        const fallback = resolvePreferredLandingPath(
          authStore.user?.preferences?.defaultModule ?? null,
          authStore.user?.preferences?.defaultMenu ?? null,
          menuStore.enabledModules,
          menuStore.moduleMenus,
        );
        if (fallback && fallback !== to.path) {
          return { path: fallback };
        }

        return { path: '/' };
      }

      if (to.path === '/admin/settings') {
        const landing = adminLandingPath();
        if (landing) {
          return { path: landing };
        }
      }

      if (!canAccessPath(to.path)) {
        if (to.path.startsWith('/admin/')) {
          const landing = adminLandingPath();
          if (landing && landing !== to.path) {
            return { path: landing };
          }
        }

        return { path: '/' };
      }

      if (!to.path.startsWith('/forms')) {
        const formInbox = useFormAssignmentStore();
        await formInbox.fetchPending();
        if (formInbox.nextRequired) {
          return { path: `/forms/${formInbox.nextRequired.id}` };
        }
      }
    }

    if (to.path === '/login' && authStore.isAuthenticated) {
      const isValid = await authStore.validateSession();
      if (isValid) {
        return { path: '/' };
      }
    }
  });

  return Router;
});
