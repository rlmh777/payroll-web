import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES, hrSettingsPath } from '@core/config/module-routes';

export const coreRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('@core/pages/LoginPage.vue') }],
  },
  {
    path: '/careers',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      {
        path: '',
        name: 'public-careers',
        component: () => import('@hr/pages/PublicCareersPage.vue'),
      },
      {
        path: ':id',
        name: 'public-career-detail',
        component: () => import('@hr/pages/PublicCareerDetailPage.vue'),
      },
    ],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@core/pages/DashboardPage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.settings,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'general-settings',
        component: () => import('@core/pages/GeneralSettingPage.vue'),
      },
      { path: '/payroll/settings/general', redirect: MODULE_ROUTES.settings },
      {
        path: '/payroll/settings/pay-items',
        component: () => import('@core/pages/SettingPage.vue'),
        props: { title: 'Setting Pay Items' },
      },
      { path: '/payroll/settings/roles', redirect: '/admin/settings/roles' },
      { path: '/payroll/settings/menu', redirect: '/admin/settings/menu' },
      { path: '/payroll/settings/modules', redirect: '/admin/settings/modules' },
      {
        path: '/payroll/settings/country',
        redirect: hrSettingsPath('country'),
      },
      { path: '/payroll/settings/general/country', redirect: hrSettingsPath('country') },
      {
        path: '/payroll/settings/institution',
        redirect: hrSettingsPath('institution'),
      },
      { path: '/payroll/settings/general/institution', redirect: hrSettingsPath('institution') },
      {
        path: '/payroll/settings/relationship',
        redirect: hrSettingsPath('relationship'),
      },
      { path: '/payroll/settings/general/relationship', redirect: hrSettingsPath('relationship') },
      {
        path: '/payroll/settings/document-tags',
        component: () => import('@core/settings/document-tag/ManageDocumentTags.vue'),
        props: { title: 'Document Tags' },
      },
      { path: '/payroll/settings/general/document-tags', redirect: '/payroll/settings/document-tags' },
      {
        path: '/payroll/settings/degree',
        redirect: hrSettingsPath('degree'),
      },
      { path: '/payroll/settings/general/degree', redirect: hrSettingsPath('degree') },
      {
        path: '/payroll/settings/job-titles',
        redirect: hrSettingsPath('job-titles'),
      },
      { path: '/payroll/settings/general/job-titles', redirect: hrSettingsPath('job-titles') },
      {
        path: '/payroll/settings/district',
        redirect: hrSettingsPath('district'),
      },
      { path: '/payroll/settings/general/district', redirect: hrSettingsPath('district') },
      {
        path: '/payroll/settings/locality',
        redirect: hrSettingsPath('locality'),
      },
      { path: '/payroll/settings/general/locality', redirect: hrSettingsPath('locality') },
      {
        path: '/payroll/settings/bank-account-type',
        component: () => import('@core/settings/bank-account-type/ManageBankAccountType.vue'),
        props: { title: 'Setting Bank Account Type' },
      },
      {
        path: '/payroll/settings/general/bank-account-type',
        redirect: '/payroll/settings/bank-account-type',
      },
      { path: '/payroll/settings/organization', redirect: '/admin/settings/organization' },
      { path: '/payroll/settings/users', redirect: '/admin/settings/users' },
      { path: '/payroll/settings/database-backup', redirect: '/admin/settings/database-backup' },
      { path: '/payroll/settings/file-storage', redirect: '/admin/settings/file-storage' },
      { path: '/payroll/settings/login-page', redirect: '/admin/settings/login-page' },
      { path: '/payroll/settings/pay-period', redirect: '/payroll/pay-period' },
    ],
  },
  {
    path: '/dashboard',
    redirect: '/',
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@core/pages/ErrorNotFound.vue'),
  },
];
