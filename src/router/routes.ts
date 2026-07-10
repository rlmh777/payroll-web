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
        component: () => import('pages/DashboardPage.vue'),
      },
      {
        path: 'employee/:id',
        component: () => import('pages/ViewEmployeePage.vue'),
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
        component: () => import('pages/GeneralSettingPage.vue'),
      },
      { path: '/settings/general', redirect: '/settings' },
      {
        path: '/settings/calendars',
        redirect: '/scheduler',
      },
      {
        path: '/settings/timesheet-templates',
        component: () => import('pages/DefineTimesheetTemplatePage.vue'),
      },
      { path: '/settings/working-hours-timesheet', redirect: '/settings/timesheet-templates' },
      { path: '/settings/general/working-hours-timesheet', redirect: '/settings/timesheet-templates' },
      {
        path: '/settings/holidays',
        component: () => import('components/settings/holiday/ManagePublicHolidays.vue'),
        props: { title: 'Public Holidays' },
      },
      { path: '/settings/general/holidays', redirect: '/settings/holidays' },
      {
        path: '/settings/attendance',
        component: () => import('components/settings/attendance/ManageAttendanceSettings.vue'),
        props: { title: 'Attendance Settings' },
      },
      { path: '/settings/general/attendance', redirect: '/settings/attendance' },
      {
        path: '/settings/leave-types',
        component: () => import('components/settings/leave/ManageLeaveTypes.vue'),
        props: { title: 'Leave Types' },
      },
      { path: '/settings/general/leave-types', redirect: '/settings/leave-types' },
      {
        path: '/settings/department-heads',
        component: () => import('components/settings/department-head/ManageDepartmentHead.vue'),
        props: { title: 'Department Heads' },
      },
      { path: '/settings/general/department-heads', redirect: '/settings/department-heads' },
      {
        path: '/settings/roles',
        component: () => import('components/settings/role/ManageRoles.vue')
      },
      {
        path: '/settings/menu',
        component: () => import('components/settings/menu/ManageMenus.vue'),
      },
      {
        path: '/settings/pay-items',
        component: () => import('pages/SettingPage.vue'),
        props: { title: 'Setting Pay Items' },
      },
      {
        path: '/settings/country',
        component: () => import('components/settings/country/ManageCountry.vue'),
        props: { title: 'Setting Country' },
      },
      { path: '/settings/general/country', redirect: '/settings/country' },
      {
        path: '/settings/institution',
        component: () => import('components/settings/institution/ManageInstitution.vue'),
        props: { title: 'Setting Institution' },
      },
      { path: '/settings/general/institution', redirect: '/settings/institution' },
      {
        path: '/settings/relationship',
        component: () => import('components/settings/relationship/ManageRelationship.vue'),
        props: { title: 'Setting Relationship' },
      },
      { path: '/settings/general/relationship', redirect: '/settings/relationship' },
      {
        path: '/settings/document-tags',
        component: () => import('components/settings/document-tag/ManageDocumentTags.vue'),
        props: { title: 'Document Tags' },
      },
      { path: '/settings/general/document-tags', redirect: '/settings/document-tags' },
      {
        path: '/settings/degree',
        component: () => import('components/settings/degree/ManageDegree.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/degree', redirect: '/settings/degree' },
      {
        path: '/settings/district',
        component: () => import('components/settings/district/ManageDistrict.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/district', redirect: '/settings/district' },
      {
        path: '/settings/locality',
        component: () => import('components/settings/locality/ManageLocality.vue'),
        props: { title: 'Setting Degree' },
      },
      { path: '/settings/general/locality', redirect: '/settings/locality' },
      {
        path: '/settings/department',
        component: () => import('components/settings/department/ManageDepartment.vue'),
        props: { title: 'Setting Department' },
      },
      { path: '/settings/general/department', redirect: '/settings/department' },
      {
        path: '/settings/worksite',
        component: () => import('components/settings/worksite/ManageWorksite.vue'),
        props: { title: 'Setting Work Site' },
      },
      { path: '/settings/general/worksite', redirect: '/settings/worksite' },
      {
        path: '/settings/bank-account-type',
        component: () => import('components/settings/bank-account-type/ManageBankAccountType.vue'),
        props: { title: 'Setting Bank Account Type' },
      },
      { path: '/settings/general/bank-account-type', redirect: '/settings/bank-account-type' },
      {
        path: '/settings/payroll-earning-codes',
        component: () => import('components/settings/payroll-earning-code/ManagePayrollEarningCode.vue'),
        props: { title: 'Payroll Earning Codes' },
      },
      { path: '/settings/general/payroll-earning-codes', redirect: '/settings/payroll-earning-codes' },
      { path: '/settings/general/calendar', redirect: '/settings/timesheet-templates' },
      {
        path: '/settings/general/calendar/define-work-timesheet',
        redirect: '/settings/timesheet-templates',
      },
      {
        path: '/settings/organization',
        component: () => import('components/settings/organization/ManageOrganization.vue'),
        props: { title: 'Organization' },
      },
      {
        path: '/settings/accounts',
        component: () => import('components/settings/account/ManageAccounts.vue'),
        props: { title: 'Accounts' },
      },
      {
        path: '/settings/users',
        component: () => import('components/users/ManageUsers.vue')
      },
      {
        path: '/settings/social-security',
        component: () => import('components/settings/social-security/ManageSocialSecurity.vue')
      },
      {
        path: '/settings/personal-relief',
        component: () => import('components/settings/personal-relief/ManagePersonalRelief.vue')
      },
      {
        path: '/settings/payroll-settings',
        component: () => import('components/settings/payroll-settings/ManagePayrollSettings.vue')
      },
      { path: '/settings/pay-period', redirect: '/payroll/pay-period' },
    ],
  },
  {
    path: '/scheduler',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true, fullHeight: true },
    children: [
      {
        path: '',
        component: () => import('pages/CalendarSettingPage.vue'),
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
        component: () => import('pages/TimesheetPage.vue'),
      },
    ],
  },
  {
    path: '/calendars',
    redirect: '/scheduler',
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
        path: '/payroll/pay-period',
        component: () => import('components/payroll/pay-period-groups/ManagePayPeriodGroups.vue'),
      },
      {
        path: '/payroll/payroll-run',
        component: () => import('pages/AttendanceTimesheetPage.vue'),
      },
      {
        path: '/payroll/generate-payslip',
        component: () => import('pages/GeneratePayslipPage.vue'),
      },
      { path: '/payroll/timesheets', redirect: '/payroll/payroll-run' },
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
