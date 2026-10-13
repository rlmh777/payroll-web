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
      {
        path: 'profile',
        name: 'employee-profile',
        component: () => import('@employee/pages/EmployeeProfilePage.vue'),
      },
      {
        path: 'profile-changes',
        name: 'employee-profile-changes',
        component: () => import('@hr/pages/ProfileChangesPage.vue'),
      },
      {
        path: 'profile-changes/:id',
        name: 'employee-profile-change-review',
        component: () => import('@hr/pages/ProfileChangeReviewPage.vue'),
      },
    ],
  },
];
