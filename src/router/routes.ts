import type { RouteRecordRaw } from 'vue-router';
import { coreRoutes } from '@core/routes';
import { hrRoutes } from '@hr/routes';
import { payrollRoutes } from '@payroll/routes';

const routes: RouteRecordRaw[] = [
  ...coreRoutes.filter((route: RouteRecordRaw) => route.path !== '/:catchAll(.*)*'),
  ...hrRoutes,
  ...payrollRoutes,
  ...coreRoutes.filter((route: RouteRecordRaw) => route.path === '/:catchAll(.*)*'),
];

export default routes;
