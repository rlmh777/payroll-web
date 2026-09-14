import type { RouteRecordRaw } from 'vue-router';
import { adminSettingsPath } from '@core/config/module-routes';

export const workflowRoutes: RouteRecordRaw[] = [
  {
    path: adminSettingsPath('pipelines'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@workflow/components/settings/ManagePipelineTemplates.vue'),
      },
    ],
  },
  {
    path: adminSettingsPath('modules'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/modules/ManageModules.vue'),
        props: { title: 'Modules' },
      },
    ],
  },
  {
    path: adminSettingsPath('database-backup'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/database-backup/ManageDatabaseBackup.vue'),
        props: { title: 'Database Backup' },
      },
    ],
  },
  {
    path: adminSettingsPath('menu'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/menu/ManageMenus.vue'),
      },
    ],
  },
  {
    path: adminSettingsPath('roles'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/role/ManageRoles.vue'),
      },
    ],
  },
  {
    path: adminSettingsPath('organization'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/organization/ManageOrganization.vue'),
        props: { title: 'Organization' },
      },
    ],
  },
  {
    path: adminSettingsPath('users'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/components/users/ManageUsers.vue'),
      },
    ],
  },
  {
    path: '/admin/settings',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        redirect: adminSettingsPath('pipelines'),
      },
    ],
  },
];
