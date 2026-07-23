import type { RouteRecordRaw } from 'vue-router';

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
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'general-settings',
        component: () => import('@core/pages/GeneralSettingPage.vue'),
      },
      { path: '/settings/general', redirect: '/settings' },
      {
        path: '/settings/pay-items',
        component: () => import('@core/pages/SettingPage.vue'),
        props: { title: 'Setting Pay Items' },
      },
      {
        path: '/settings/roles',
        component: () => import('@core/settings/role/ManageRoles.vue'),
      },
      {
        path: '/settings/menu',
        component: () => import('@core/settings/menu/ManageMenus.vue'),
      },
      {
        path: '/settings/country',
        component: () => import('@core/settings/country/ManageCountry.vue'),
        props: { title: 'Setting Country' },
      },
      { path: '/settings/general/country', redirect: '/settings/country' },
      {
        path: '/settings/institution',
        component: () => import('@core/settings/institution/ManageInstitution.vue'),
        props: { title: 'Setting Institution' },
      },
      { path: '/settings/general/institution', redirect: '/settings/institution' },
      {
        path: '/settings/relationship',
        component: () => import('@core/settings/relationship/ManageRelationship.vue'),
        props: { title: 'Setting Relationship' },
      },
      { path: '/settings/general/relationship', redirect: '/settings/relationship' },
      {
        path: '/settings/document-tags',
        component: () => import('@core/settings/document-tag/ManageDocumentTags.vue'),
        props: { title: 'Document Tags' },
      },
      { path: '/settings/general/document-tags', redirect: '/settings/document-tags' },
      {
        path: '/settings/degree',
        component: () => import('@core/settings/degree/ManageDegree.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/degree', redirect: '/settings/degree' },
      {
        path: '/settings/job-titles',
        component: () => import('@core/settings/job-title/ManageJobTitle.vue'),
        props: { title: 'Job Titles' },
      },
      { path: '/settings/general/job-titles', redirect: '/settings/job-titles' },
      {
        path: '/settings/district',
        component: () => import('@core/settings/district/ManageDistrict.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/district', redirect: '/settings/district' },
      {
        path: '/settings/locality',
        component: () => import('@core/settings/locality/ManageLocality.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/locality', redirect: '/settings/locality' },
      {
        path: '/settings/bank-account-type',
        component: () => import('@core/settings/bank-account-type/ManageBankAccountType.vue'),
        props: { title: 'Setting Bank Account Type' },
      },
      { path: '/settings/general/bank-account-type', redirect: '/settings/bank-account-type' },
      {
        path: '/settings/organization',
        component: () => import('@core/settings/organization/ManageOrganization.vue'),
        props: { title: 'Organization' },
      },
      {
        path: '/settings/users',
        component: () => import('@core/components/users/ManageUsers.vue'),
      },
      {
        path: '/settings/database-backup',
        component: () => import('@core/settings/database-backup/ManageDatabaseBackup.vue'),
        props: { title: 'Database Backup' },
      },
      { path: '/settings/pay-period', redirect: '/payroll/pay-period' },
    ],
  },
  {
    path: '/dashboard',
    redirect: '/',
  },
  {
    path: '/accounts',
    redirect: '/settings/accounts',
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('@core/pages/ErrorNotFound.vue'),
  },
];
