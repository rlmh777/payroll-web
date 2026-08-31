import type { RouteRecordRaw } from 'vue-router';

/** Redirect legacy unprefixed URLs to module-prefixed routes. */
export const legacyRouteRedirects: RouteRecordRaw[] = [
  { path: '/timesheet', redirect: '/payroll/timesheet' },
  { path: '/scheduler', redirect: '/payroll/scheduler' },
  { path: '/calendars', redirect: '/payroll/scheduler' },
  { path: '/employees', redirect: '/payroll/employees' },
  {
    path: '/employees/:pathMatch(.*)*',
    redirect: (to) => `/payroll/employees/${String(to.params.pathMatch ?? '')}`,
  },
  {
    path: '/employee/:id',
    redirect: (to) => `/payroll/employees/${String(to.params.id)}`,
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
  { path: '/settings', redirect: '/payroll/settings' },
  {
    path: '/settings/:pathMatch(.*)*',
    redirect: (to) => `/payroll/settings/${String(to.params.pathMatch ?? '')}`,
  },
  { path: '/accounts', redirect: '/payroll/settings/accounts' },
];
