import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES } from '@core/config/module-routes';

export const employeeRoutes: RouteRecordRaw[] = [
  {
    path: MODULE_ROUTES.employee,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@employee/pages/EmployeeDashboardPage.vue'),
      },
    ],
  },
];
