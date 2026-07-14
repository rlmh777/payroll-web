import type { RouteRecordRaw } from 'vue-router';

export const hrRoutes: RouteRecordRaw[] = [
  {
    path: '/scheduler',
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
    path: '/timesheet',
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
    path: '/employees',
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
    path: '/leaves',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', redirect: '/leaves/list' },
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
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: 'employee/:id',
        component: () => import('@hr/pages/ViewEmployeePage.vue'),
      },
    ],
  },
  {
    path: '/settings',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '/settings/calendars', redirect: '/scheduler' },
      {
        path: '/settings/timesheet-templates',
        component: () => import('@hr/pages/DefineTimesheetTemplatePage.vue'),
      },
      { path: '/settings/working-hours-timesheet', redirect: '/settings/timesheet-templates' },
      { path: '/settings/general/working-hours-timesheet', redirect: '/settings/timesheet-templates' },
      {
        path: '/settings/holidays',
        component: () => import('@hr/components/settings/holiday/ManagePublicHolidays.vue'),
        props: { title: 'Public Holidays' },
      },
      { path: '/settings/general/holidays', redirect: '/settings/holidays' },
      {
        path: '/settings/attendance',
        component: () => import('@hr/components/settings/attendance/ManageAttendanceSettings.vue'),
        props: { title: 'Attendance Settings' },
      },
      { path: '/settings/general/attendance', redirect: '/settings/attendance' },
      {
        path: '/settings/leave-types',
        redirect: '/leaves/types',
      },
      { path: '/settings/general/leave-types', redirect: '/leaves/types' },
      {
        path: '/settings/department-heads',
        component: () => import('@hr/components/settings/department-head/ManageDepartmentHead.vue'),
        props: { title: 'Department Heads' },
      },
      { path: '/settings/general/department-heads', redirect: '/settings/department-heads' },
      {
        path: '/settings/department',
        component: () => import('@hr/components/settings/department/ManageDepartment.vue'),
        props: { title: 'Setting Department' },
      },
      { path: '/settings/general/department', redirect: '/settings/department' },
      {
        path: '/settings/worksite',
        component: () => import('@hr/components/settings/worksite/ManageWorksite.vue'),
        props: { title: 'Setting Work Site' },
      },
      { path: '/settings/general/worksite', redirect: '/settings/worksite' },
      { path: '/settings/general/calendar', redirect: '/settings/timesheet-templates' },
      {
        path: '/settings/general/calendar/define-work-timesheet',
        redirect: '/settings/timesheet-templates',
      },
    ],
  },
  {
    path: '/calendars',
    redirect: '/scheduler',
  },
];
