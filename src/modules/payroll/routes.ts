import type { RouteRecordRaw } from 'vue-router';

export const payrollRoutes: RouteRecordRaw[] = [
  {
    path: '/payroll',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@payroll/pages/PayrollPage.vue'),
        props: { title: 'Payroll Page' },
      },
      {
        path: '/payroll/overview',
        component: () => import('@payroll/pages/PayrollPage.vue'),
        props: { title: 'Payroll Overview' },
      },
      {
        path: '/payroll/pay-period',
        component: () => import('@payroll/components/payroll/pay-period-groups/ManagePayPeriodGroups.vue'),
      },
      {
        path: '/payroll/payroll-run',
        component: () => import('@payroll/pages/AttendanceTimesheetPage.vue'),
      },
      {
        path: '/payroll/allowances',
        component: () => import('@payroll/pages/PayrollAllowancesPage.vue'),
        props: { title: 'Payroll Allowances' },
      },
      {
        path: '/payroll/day-work',
        component: () => import('@payroll/pages/EmployeeDayWorkPage.vue'),
        props: { title: 'Day / trip work' },
      },
      {
        path: '/payroll/generate-payslip',
        component: () => import('@payroll/pages/GeneratePayslipPage.vue'),
      },
      { path: '/payroll/timesheets', redirect: '/payroll/payroll-run' },
      {
        path: '/payroll/taxes-filing',
        component: () => import('@payroll/pages/PayrollPage.vue'),
        props: { title: 'Payroll Taxes Filing' },
      },
    ],
  },
  {
    path: '/reports',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('@payroll/pages/ReportsPage.vue') }],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/settings/payroll-earning-codes',
        component: () => import('@payroll/components/settings/payroll-earning-code/ManagePayrollEarningCode.vue'),
        props: { title: 'Payroll Earning Codes' },
      },
      { path: '/settings/general/payroll-earning-codes', redirect: '/settings/payroll-earning-codes' },
      {
        path: '/settings/pool-distribution-types',
        component: () => import('@payroll/components/settings/pool-distribution/ManagePoolDistributionType.vue'),
        props: { title: 'Pool Distribution' },
      },
      { path: '/settings/general/pool-distribution-types', redirect: '/settings/pool-distribution-types' },
      {
        path: '/settings/accounts',
        component: () => import('@payroll/components/settings/account/ManageAccounts.vue'),
        props: { title: 'Accounts' },
      },
      {
        path: '/settings/account-mapping',
        component: () => import('@payroll/components/settings/account-mapping/ManagePayrollAccountMapping.vue'),
        props: { title: 'Account Mapping' },
      },
      { path: '/settings/accounts/mapping', redirect: '/settings/account-mapping' },
      {
        path: '/settings/social-security',
        component: () => import('@payroll/components/settings/social-security/ManageSocialSecurity.vue'),
      },
      {
        path: '/settings/personal-relief',
        component: () => import('@payroll/components/settings/personal-relief/ManagePersonalRelief.vue'),
      },
      {
        path: '/settings/payroll-settings',
        component: () => import('@payroll/components/settings/payroll-settings/ManagePayrollSettings.vue'),
      },
    ],
  },
];
