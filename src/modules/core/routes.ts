import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES } from '@core/config/module-routes';

export const coreRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('@core/pages/LoginPage.vue') }],
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
      {
        path: '/payroll/settings/roles',
        component: () => import('@core/settings/role/ManageRoles.vue'),
      },
      {
        path: '/payroll/settings/menu',
        component: () => import('@core/settings/menu/ManageMenus.vue'),
      },
      {
        path: '/payroll/settings/modules',
        component: () => import('@core/settings/modules/ManageModules.vue'),
        props: { title: 'Modules' },
      },
      {
        path: '/payroll/settings/country',
        component: () => import('@core/settings/country/ManageCountry.vue'),
        props: { title: 'Setting Country' },
      },
      { path: '/payroll/settings/general/country', redirect: '/payroll/settings/country' },
      {
        path: '/payroll/settings/institution',
        component: () => import('@core/settings/institution/ManageInstitution.vue'),
        props: { title: 'Setting Institution' },
      },
      { path: '/payroll/settings/general/institution', redirect: '/payroll/settings/institution' },
      {
        path: '/payroll/settings/relationship',
        component: () => import('@core/settings/relationship/ManageRelationship.vue'),
        props: { title: 'Setting Relationship' },
      },
      { path: '/payroll/settings/general/relationship', redirect: '/payroll/settings/relationship' },
      {
        path: '/payroll/settings/document-tags',
        component: () => import('@core/settings/document-tag/ManageDocumentTags.vue'),
        props: { title: 'Document Tags' },
      },
      { path: '/payroll/settings/general/document-tags', redirect: '/payroll/settings/document-tags' },
      {
        path: '/payroll/settings/degree',
        component: () => import('@core/settings/degree/ManageDegree.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/payroll/settings/general/degree', redirect: '/payroll/settings/degree' },
      {
        path: '/payroll/settings/job-titles',
        component: () => import('@core/settings/job-title/ManageJobTitle.vue'),
        props: { title: 'Job Titles' },
      },
      { path: '/payroll/settings/general/job-titles', redirect: '/payroll/settings/job-titles' },
      {
        path: '/payroll/settings/district',
        component: () => import('@core/settings/district/ManageDistrict.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/payroll/settings/general/district', redirect: '/payroll/settings/district' },
      {
        path: '/payroll/settings/locality',
        component: () => import('@core/settings/locality/ManageLocality.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/payroll/settings/general/locality', redirect: '/payroll/settings/locality' },
      {
        path: '/payroll/settings/bank-account-type',
        component: () => import('@core/settings/bank-account-type/ManageBankAccountType.vue'),
        props: { title: 'Setting Bank Account Type' },
      },
      {
        path: '/payroll/settings/general/bank-account-type',
        redirect: '/payroll/settings/bank-account-type',
      },
      {
        path: '/payroll/settings/organization',
        component: () => import('@core/settings/organization/ManageOrganization.vue'),
        props: { title: 'Organization' },
      },
      {
        path: '/payroll/settings/users',
        component: () => import('@core/components/users/ManageUsers.vue'),
      },
      {
        path: '/payroll/settings/database-backup',
        component: () => import('@core/settings/database-backup/ManageDatabaseBackup.vue'),
        props: { title: 'Database Backup' },
      },
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
