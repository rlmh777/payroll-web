import type { RouteRecordRaw } from 'vue-router';

/** Redirect legacy unprefixed / payroll-prefixed URLs to owning-module routes. */
export const legacyRouteRedirects: RouteRecordRaw[] = [
  { path: '/timesheet', redirect: '/payroll/timesheet' },
  { path: '/scheduler', redirect: '/payroll/scheduler' },
  { path: '/calendars', redirect: '/payroll/scheduler' },
  { path: '/employees', redirect: '/hr/employees' },
  {
    path: '/employees/:pathMatch(.*)*',
    redirect: (to) => `/hr/employees/${String(to.params.pathMatch ?? '')}`,
  },
  {
    path: '/employee/:id',
    redirect: (to) => `/hr/employees/${String(to.params.id)}`,
  },
  { path: '/leaves', redirect: '/payroll/leaves/list' },
  {
    path: '/leaves/:pathMatch(.*)*',
    redirect: (to) => `/payroll/leaves/${String(to.params.pathMatch ?? '')}`,
  },
  { path: '/reports', redirect: '/payroll/reports/journal-entries' },
  {
    path: '/reports/:reportId',
    redirect: (to) => `/payroll/reports/${String(to.params.reportId)}`,
  },
  { path: '/core/reports', redirect: '/payroll/reports/journal-entries' },
  {
    path: '/core/reports/:reportId',
    redirect: (to) => `/payroll/reports/${String(to.params.reportId)}`,
  },
  { path: '/settings', redirect: '/payroll/settings' },
  {
    path: '/settings/:pathMatch(.*)*',
    redirect: (to) => `/payroll/settings/${String(to.params.pathMatch ?? '')}`,
  },
  { path: '/payroll/settings/pipelines', redirect: '/admin/settings/pipelines' },
  { path: '/payroll/settings/modules', redirect: '/admin/settings/modules' },
  { path: '/payroll/settings/database-backup', redirect: '/admin/settings/database-backup' },
  { path: '/payroll/settings/menu', redirect: '/admin/settings/menu' },
  { path: '/payroll/settings/roles', redirect: '/admin/settings/roles' },
  { path: '/payroll/settings/organization', redirect: '/admin/settings/organization' },
  { path: '/payroll/settings/users', redirect: '/admin/settings/users' },
  { path: '/accounts', redirect: '/payroll/settings/accounts' },
];
