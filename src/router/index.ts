import { route } from 'quasar/wrappers';
import {
  createMemoryHistory,
  createRouter,
  createWebHashHistory,
  createWebHistory,
} from 'vue-router';
import { useAuthStore } from 'src/stores/auth';
import routes from './routes';
import {
  prepareSchedulerEmployees,
  resetSchedulerEmployeesIfLeaving,
} from 'src/utils/scheduler-bootstrap';

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

  authStore.setUnauthorizedHandler((redirectPath) => {
    const target = redirectPath && redirectPath !== '/login'
      ? { path: '/login', query: { redirect: redirectPath, reason: 'session-expired' } }
      : { path: '/login', query: { reason: 'session-expired' } };

    void Router.push(target);
  });

  Router.beforeEach(async (to, from) => {
    authStore.checkAuth();

    resetSchedulerEmployeesIfLeaving(from.path, to.path);

    if (to.matched.some((record) => record.meta.requiresAuth)) {
      if (!authStore.isAuthenticated) {
        return {
          path: '/login',
          query: { redirect: to.fullPath },
        };
      }

      const isValid = await authStore.validateSession();
      if (!isValid) {
        return {
          path: '/login',
          query: { redirect: to.fullPath, reason: 'session-expired' },
        };
      }
    }

    if (to.path === '/login' && authStore.isAuthenticated) {
      const isValid = await authStore.validateSession();
      if (isValid) {
        return { path: '/' };
      }
    }

    if (to.path.startsWith('/scheduler') || to.path.startsWith('/timesheet')) {
      const enteringScheduler =
        !from.path.startsWith('/scheduler') && !from.path.startsWith('/timesheet');
      await prepareSchedulerEmployees({ force: enteringScheduler });
    }
  });

  return Router;
});
