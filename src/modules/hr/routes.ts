import type { RouteRecordRaw } from 'vue-router';
import { MODULE_ROUTES, hrSettingsPath } from '@core/config/module-routes';

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
        path: 'vacancies',
        redirect: MODULE_ROUTES.vacancies,
      },
      {
        path: 'candidates',
        redirect: MODULE_ROUTES.candidates,
      },
      {
        path: ':id',
        component: () => import('@hr/pages/ViewEmployeePage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.vacancies,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      {
        path: '',
        name: 'hr-vacancies',
        component: () => import('@hr/pages/VacanciesPage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.candidates,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      {
        path: '',
        name: 'hr-candidates',
        component: () => import('@hr/pages/CandidatesPage.vue'),
      },
    ],
  },
  {
    path: MODULE_ROUTES.payrollEmployees,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'payroll-employees',
        component: () => import('@hr/pages/EmployeePage.vue'),
      },
      {
        path: 'new',
        name: 'payroll-employees-new',
        component: () => import('@hr/pages/CreateEmployeePage.vue'),
      },
      {
        path: 'import',
        name: 'payroll-employees-import',
        component: () => import('@hr/pages/EmployeeImportPage.vue'),
      },
      {
        path: 'vacancies',
        redirect: MODULE_ROUTES.vacancies,
      },
      {
        path: 'candidates',
        redirect: MODULE_ROUTES.candidates,
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
    path: MODULE_ROUTES.hrSettings,
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        name: 'hr-settings',
        component: () => import('@hr/pages/HrSettingsPage.vue'),
      },
      {
        path: 'vacancy-stages',
        name: 'hr-vacancy-stages',
        component: () => import('@hr/components/settings/vacancy-stages/ManageVacancyStages.vue'),
        props: { title: 'Vacancy pipeline' },
      },
      {
        path: 'candidate-stages',
        name: 'hr-candidate-stages',
        component: () => import('@hr/components/settings/vacancy-stages/ManageCandidateStages.vue'),
        props: { title: 'Candidate pipeline' },
      },
      {
        path: 'job-titles',
        component: () => import('@core/settings/job-title/ManageJobTitle.vue'),
        props: { title: 'Job Titles' },
      },
      {
        path: 'department',
        component: () => import('@hr/components/settings/department/ManageDepartment.vue'),
        props: { title: 'Setting Department' },
      },
      {
        path: 'worksite',
        component: () => import('@hr/components/settings/worksite/ManageWorksite.vue'),
        props: { title: 'Setting Work Site' },
      },
      {
        path: 'holidays',
        component: () => import('@hr/components/settings/holiday/ManagePublicHolidays.vue'),
        props: { title: 'Public Holidays' },
      },
      {
        path: 'birthdays',
        component: () => import('@hr/components/settings/birthdays/ManageBirthdaySettings.vue'),
        props: { title: 'Birthdays' },
      },
      {
        path: 'letter-templates',
        component: () => import('@hr/components/settings/templates/ManageHrTemplates.vue'),
        props: { title: 'Letter templates', channel: 'letter' },
      },
      {
        path: 'email-templates',
        component: () => import('@hr/components/settings/templates/ManageHrTemplates.vue'),
        props: { title: 'Email templates', channel: 'email' },
      },
      {
        path: 'relationship',
        component: () => import('@core/settings/relationship/ManageRelationship.vue'),
        props: { title: 'Setting Relationship' },
      },
      {
        path: 'degree',
        component: () => import('@core/settings/degree/ManageDegree.vue'),
        props: { title: 'Setting Degree' },
      },
      {
        path: 'country',
        component: () => import('@core/settings/country/ManageCountry.vue'),
        props: { title: 'Setting Country' },
      },
      {
        path: 'district',
        component: () => import('@core/settings/district/ManageDistrict.vue'),
        props: { title: 'Setting District' },
      },
      {
        path: 'locality',
        component: () => import('@core/settings/locality/ManageLocality.vue'),
        props: { title: 'Setting Locality' },
      },
      {
        path: 'institution',
        component: () => import('@core/settings/institution/ManageInstitution.vue'),
        props: { title: 'Setting Institution' },
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
        redirect: hrSettingsPath('holidays'),
      },
      { path: '/payroll/settings/general/holidays', redirect: hrSettingsPath('holidays') },
      {
        path: '/payroll/settings/attendance',
        component: () => import('@hr/components/settings/attendance/ManageAttendanceSettings.vue'),
        props: { title: 'Attendance Settings' },
      },
      { path: '/payroll/settings/general/attendance', redirect: '/payroll/settings/attendance' },
      {
        path: '/payroll/settings/scheduler-metrics',
        component: () => import('@hr/components/settings/scheduler-metrics/ManageSchedulerMetrics.vue'),
        props: { title: 'Scheduler Metrics' },
      },
      {
        path: '/payroll/settings/vacancy-stages',
        redirect: hrSettingsPath('vacancy-stages'),
      },
      {
        path: '/payroll/settings/general/vacancy-stages',
        redirect: hrSettingsPath('vacancy-stages'),
      },
      {
        path: '/payroll/settings/candidate-stages',
        redirect: hrSettingsPath('candidate-stages'),
      },
      {
        path: '/payroll/settings/general/candidate-stages',
        redirect: hrSettingsPath('candidate-stages'),
      },
      {
        path: '/payroll/settings/general/scheduler-metrics',
        redirect: '/payroll/settings/scheduler-metrics',
      },
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
        redirect: hrSettingsPath('department'),
      },
      { path: '/payroll/settings/general/department', redirect: hrSettingsPath('department') },
      {
        path: '/payroll/settings/worksite',
        redirect: hrSettingsPath('worksite'),
      },
      {
        path: '/payroll/settings/employee-groups',
        component: () => import('@hr/components/settings/employee-group/ManageEmployeeGroups.vue'),
        props: { title: 'Employee Groups' },
      },
      { path: '/payroll/settings/general/worksite', redirect: hrSettingsPath('worksite') },
      { path: '/payroll/settings/general/calendar', redirect: '/payroll/settings/timesheet-templates' },
      {
        path: '/payroll/settings/general/calendar/define-work-timesheet',
        redirect: '/payroll/settings/timesheet-templates',
      },
    ],
  },
];
