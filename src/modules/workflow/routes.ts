import type { RouteRecordRaw } from 'vue-router';
import { adminSettingsPath } from '@core/config/module-routes';
import { useMenuStore } from '@core/stores/menus';
import { moduleLandingPath } from '@core/utils/menu-navigation';

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
    path: adminSettingsPath('biometric-devices'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/biometric-devices/ManageBiometricDevices.vue'),
        props: { title: 'Biometric Devices' },
      },
    ],
  },
  {
    path: adminSettingsPath('application-logs'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/application-logs/ManageApplicationLogs.vue'),
        props: { title: 'Application Logs' },
      },
    ],
  },
  {
    path: adminSettingsPath('file-storage'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/file-storage/ManageFileStorage.vue'),
        props: { title: 'File Storage' },
      },
    ],
  },
  {
    path: adminSettingsPath('email'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/email/ManageEmailSettings.vue'),
        props: { title: 'Email' },
      },
    ],
  },
  {
    path: adminSettingsPath('login'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/login/ManageLoginSettings.vue'),
        props: { title: 'Login' },
      },
    ],
  },
  {
    path: adminSettingsPath('login-page'),
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/settings/login-page/ManageLoginPage.vue'),
        props: { title: 'Login Page' },
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
        beforeEnter: () => {
          const menuStore = useMenuStore();
          const landing = moduleLandingPath('/admin/settings', menuStore.moduleMenus.admin ?? []);
          return landing && landing !== '/admin/settings' ? landing : '/';
        },
        component: () => import('@workflow/components/settings/ManagePipelineTemplates.vue'),
      },
    ],
  },
];
