import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES } from '@core/config/module-routes';

export const hrRoutes: RouteRecordRaw[] = [
  {
    path: MODULE_ROUTES.scheduler,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      {
        path: '',
        component: () => import('@hr/pages/CalendarSettingPage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.timesheet,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      {
        path: '',
        component: () => import('@hr/pages/TimesheetPage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.employees,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'employees',
        component: () => import('@hr/pages/EmployeePage.vue'),
      },
      {
        path: 'new',
        name: 'employees-new',
        component: () => import('@hr/pages/CreateEmployeePage.vue'),
      },
      {
        path: 'import',
        name: 'employees-import',
        component: () => import('@hr/pages/EmployeeImportPage.vue'),
      },
      {
        path: ':id',
        component: () => import('@hr/pages/ViewEmployeePage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.leaves,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: `${MODULE_ROUTES.leaves}/list` },
      {
        path: 'list',
        component: () => import('@hr/pages/LeaveListPage.vue'),
      },
      {
        path: 'assign',
        component: () => import('@hr/pages/AssignLeavePage.vue'),
      },
      {
        path: 'request',
        component: () => import('@hr/pages/RequestLeavePage.vue'),
      },
      {
        path: 'my-usage',
        component: () => import('@hr/pages/MyLeaveUsagePage.vue'),
      },
      {
        path: 'calendar',
        component: () => import('@hr/pages/LeaveCalendarPage.vue'),
      },
      {
        path: 'entitlement',
        component: () => import('@hr/pages/LeaveEntitlementPage.vue'),
      },
      {
        path: 'types',
        component: () => import('@hr/components/settings/leave/ManageLeaveTypes.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.settings,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '/payroll/settings/calendars', redirect: MODULE_ROUTES.scheduler },
      {
        path: '/payroll/settings/timesheet-templates',
        component: () => import('@hr/pages/DefineTimesheetTemplatePage.vue'),
      },
      {
        path: '/payroll/settings/working-hours-timesheet',
        redirect: '/payroll/settings/timesheet-templates',
      },
      {
        path: '/payroll/settings/general/working-hours-timesheet',
        redirect: '/payroll/settings/timesheet-templates',
      },
      {
        path: '/payroll/settings/holidays',
        component: () => import('@hr/components/settings/holiday/ManagePublicHolidays.vue'),
        props: { title: 'Public Holidays' },
      },
      { path: '/payroll/settings/general/holidays', redirect: '/payroll/settings/holidays' },
      {
        path: '/payroll/settings/attendance',
        component: () => import('@hr/components/settings/attendance/ManageAttendanceSettings.vue'),
        props: { title: 'Attendance Settings' },
      },
      { path: '/payroll/settings/general/attendance', redirect: '/payroll/settings/attendance' },
      {
        path: '/payroll/settings/leave-types',
        redirect: `${MODULE_ROUTES.leaves}/types`,
      },
      { path: '/payroll/settings/general/leave-types', redirect: `${MODULE_ROUTES.leaves}/types` },
      {
        path: '/payroll/settings/department-heads',
        component: () => import('@hr/components/settings/department-head/ManageDepartmentHead.vue'),
        props: { title: 'Department Heads' },
      },
      {
        path: '/payroll/settings/general/department-heads',
        redirect: '/payroll/settings/department-heads',
      },
      {
        path: '/payroll/settings/department',
        component: () => import('@hr/components/settings/department/ManageDepartment.vue'),
        props: { title: 'Setting Department' },
      },
      { path: '/payroll/settings/general/department', redirect: '/payroll/settings/department' },
      {
        path: '/payroll/settings/worksite',
        component: () => import('@hr/components/settings/worksite/ManageWorksite.vue'),
        props: { title: 'Setting Work Site' },
      },
      {
        path: '/payroll/settings/employee-groups',
        component: () => import('@hr/components/settings/employee-group/ManageEmployeeGroups.vue'),
        props: { title: 'Employee Groups' },
      },
      { path: '/payroll/settings/general/worksite', redirect: '/payroll/settings/worksite' },
      { path: '/payroll/settings/general/calendar', redirect: '/payroll/settings/timesheet-templates' },
      {
        path: '/payroll/settings/general/calendar/define-work-timesheet',
        redirect: '/payroll/settings/timesheet-templates',
      },
    ],
  },
];
