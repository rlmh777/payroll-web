import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES, reportPath } from '@core/config/module-routes';

export const payrollRoutes: RouteRecordRaw[] = [
  {
    path: MODULE_ROUTES.payroll,
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
        props: { title: 'Payroll Other Payments' },
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
    path: MODULE_ROUTES.reports,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      { path: '', redirect: reportPath('journal-entries') },
      {
        path: ':reportId',
        component: () => import('@payroll/pages/ReportsPage.vue'),
        props: true,
      },
    ],
  },
  {
    path: MODULE_ROUTES.settings,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '/payroll/settings/payroll-earning-codes',
        component: () => import('@payroll/components/settings/payroll-earning-code/ManagePayrollEarningCode.vue'),
        props: { title: 'Payroll Earning Codes' },
      },
      {
        path: '/payroll/settings/general/payroll-earning-codes',
        redirect: '/payroll/settings/payroll-earning-codes',
      },
      {
        path: '/payroll/settings/pool-distribution-types',
        component: () => import('@payroll/components/settings/pool-distribution/ManagePoolDistributionType.vue'),
        props: { title: 'Pool Distribution' },
      },
      {
        path: '/payroll/settings/general/pool-distribution-types',
        redirect: '/payroll/settings/pool-distribution-types',
      },
      {
        path: '/payroll/settings/accounts',
        component: () => import('@payroll/components/settings/account/ManageAccounts.vue'),
        props: { title: 'Accounts' },
      },
      {
        path: '/payroll/settings/account-mapping',
        component: () => import('@payroll/components/settings/account-mapping/ManagePayrollAccountMapping.vue'),
        props: { title: 'Account Mapping' },
      },
      { path: '/payroll/settings/accounts/mapping', redirect: '/payroll/settings/account-mapping' },
      {
        path: '/payroll/settings/social-security',
        component: () => import('@payroll/components/settings/social-security/ManageSocialSecurity.vue'),
      },
      {
        path: '/payroll/settings/personal-relief',
        component: () => import('@payroll/components/settings/personal-relief/ManagePersonalRelief.vue'),
      },
      {
        path: '/payroll/settings/payroll-settings',
        component: () => import('@payroll/components/settings/payroll-settings/ManagePayrollSettings.vue'),
      },
      {
        path: '/payroll/settings/tax-calculator-accounts',
        component: () => import('@payroll/components/settings/tax-calculator/ManageTaxCalculatorAccounts.vue'),
        props: { title: 'GST Calculator' },
      },
      {
        path: '/payroll/settings/tax-calculator-rates',
        redirect: '/payroll/settings/tax-calculator-accounts',
      },
    ],
  },
];
