import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [{ path: '', component: () => import('pages/LoginPage.vue') }],
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/IndexPage.vue'),
      },
      {
        path: 'employee/:id',
        component: () => import('pages/ViewEmployeePage.vue'),
      },
    ],
  },
  {
    path: '/settings/general',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'general-settings',
        component: () => import('pages/GeneralSettingPage.vue'),
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', component: () => import('pages/SettingPage.vue'), props: { title: 'Settings' } },
      {
        path: '/settings/organization',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Organization' },
      },
      {
        path: '/settings/calendars',
        component: () => import('pages/CalendarSettingPage.vue'),
      },
      {
        path: '/settings/calendars/define-work-timesheet',
        component: () => import('pages/DefineWorkTimesheetPage.vue'),
      },
      {
        path: '/settings/calendars/work-shift-departments',
        component: () => import('pages/WorkShiftDepartmentsPage.vue'),
      },
      {
        path: '/settings/holidays',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Holidays' },
      },
      {
        path: '/settings/roles-menus/roles',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Roles' },
      },
      {
        path: '/settings/roles-menus/menu',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Menus' },
      },
      {
        path: '/settings/roles-menus/permissions',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Permissions' },
      },
      {
        path: '/settings/pay-items',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Pay Items' },
      },
      {
        path: '/settings/general/country',
        component: () => import('components/settings/country/ManageCountry.vue'),
        props: { title: 'Setting Country' },
      },
      {
        path: '/settings/general/institution',
        component: () => import('components/settings/institution/ManageInstitution.vue'),
        props: { title: 'Setting Institution' },
      },
      {
        path: '/settings/general/degree',
        component: () => import('components/settings/degree/ManageDegree.vue'),
        props: { title: 'Setting Degree' },
      },
      {
        path: '/settings/general/district',
        component: () => import('components/settings/district/ManageDistrict.vue'),
        props: { title: 'Setting Degree' },
      },
      {
        path: '/settings/general/locality',
        component: () => import('components/settings/locality/ManageLocality.vue'),
        props: { title: 'Setting Degree' },
      },
      {
        path: '/settings/general/calendar',
        component: () => import('pages/CalendarGeneralPage.vue'),
      },
      {
        path: '/settings/general/calendar/define-work-timesheet',
        redirect: '/payroll/timesheets',
      },
      {
        path: '/settings/general/calendar/work-shift-departments',
        component: () => import('pages/WorkShiftDepartmentsPage.vue'),
      },
    ],
  },
  {
    path: '/calendars',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('pages/CalendarSettingPage.vue') }],
  },
  {
    path: '/dashboard',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('pages/DashboardPage.vue') }],
  },
  {
    path: '/accounts',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('pages/AccountsPage.vue') }],
  },
  {
    path: '/payroll',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('pages/PayrollPage.vue'),
        props: { title: 'Payroll Page' },
      },
      {
        path: '/payroll/overview',
        component: () => import('pages/PayrollPage.vue'),
        props: { title: 'Payroll Overview' },
      },
      {
        path: '/payroll/leave',
        component: () => import('pages/PayrollPage.vue'),
        props: { title: 'Payroll Leave' },
      },
      {
        path: '/payroll/timesheets',
        component: () => import('pages/DefineWorkTimesheetPage.vue'),
        props: { title: 'Payroll Timesheets' },
      },
      {
        path: '/payroll/pay-employees',
        component: () => import('pages/PayrollPage.vue'),
        props: { title: 'Payroll Pay Employees' },
      },
      {
        path: '/payroll/taxes-filing',
        component: () => import('pages/PayrollPage.vue'),
        props: { title: 'Payroll Taxes Filing' },
      },
    ],
  },
  {
    path: '/employees',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'employees',
        component: () => import('pages/EmployeePage.vue'),
      },
      {
        path: ':id',
        component: () => import('pages/ViewEmployeePage.vue'),
      },
    ],
  },
  {
    path: '/reports',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('pages/ReportsPage.vue') }],
  },
  {
    path: '/leaves',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [{ path: '', component: () => import('pages/LeaveApprovalPage.vue') }],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
