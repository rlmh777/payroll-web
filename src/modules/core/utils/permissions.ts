export const CRUD_PERMISSIONS = {
  account: 'view-accounts',
  accountMapping: 'account-mapping-crud',
  databaseBackup: 'database-backup-crud',
  allowance: 'view-pay-items',
  bank: 'bank-account-type-crud',
  bankAccountType: 'bank-account-type-crud',
  contractType: 'employees-crud',
  degree: 'degree-crud',
  jobTitle: 'job-title-crud',
  poolDistributionType: 'pool-distribution-type-crud',
  department: 'department-crud',
  employeeGroup: 'employee-groups-crud',
  pipelineTemplate: 'pipeline-templates-crud',
  district: 'district-crud',
  documentTag: 'employees-crud',
  employeeStatus: 'employees-crud',
  employmentStatus: 'employees-crud',
  institution: 'institution-crud',
  leaveType: 'leave-crud',
  locality: 'locality-crud',
  payPeriodGroup: 'pay-employees-crud',
  payRateFrequency: 'pay-employees-crud',
  payrollEarningCode: 'payroll-earning-code-crud',
  taxCalculator: 'tax-calculator-crud',
  relationship: 'relationship-crud',
  ssBenefitType: 'manager-social-security',
  timesheetTemplate: 'view-timesheet-templates',
  vendor: 'view-organization',
  workSite: 'worksite-crud',
} as const;

export type CrudResource = keyof typeof CRUD_PERMISSIONS;

export const ROUTE_VIEW_PERMISSIONS: Array<{ prefix: string; permission: string | string[] }> = [
  { prefix: '/payroll/settings/district', permission: 'view-district' },
  { prefix: '/payroll/settings/locality', permission: 'view-locality' },
  { prefix: '/payroll/settings/department', permission: 'view-department' },
  { prefix: '/payroll/settings/employee-groups', permission: 'view-employee-groups' },
  { prefix: '/payroll/settings/scheduler-metrics', permission: 'view-scheduler-metrics' },
  { prefix: '/admin/settings/pipelines', permission: 'view-pipeline-templates' },
  { prefix: '/payroll/settings/pipelines', permission: 'view-pipeline-templates' },
  { prefix: '/admin/settings/modules', permission: 'manage-modules' },
  { prefix: '/payroll/settings/modules', permission: 'manage-modules' },
  { prefix: '/admin/settings/database-backup', permission: 'view-database-backup' },
  { prefix: '/payroll/settings/database-backup', permission: 'view-database-backup' },
  { prefix: '/admin/settings/menu', permission: 'view-menu' },
  { prefix: '/payroll/settings/menu', permission: 'view-menu' },
  { prefix: '/admin/settings/roles', permission: 'view-roles' },
  { prefix: '/payroll/settings/roles', permission: 'view-roles' },
  { prefix: '/admin/settings/organization', permission: 'view-organization' },
  { prefix: '/payroll/settings/organization', permission: 'view-organization' },
  { prefix: '/admin/settings/users', permission: ['manager-users', 'reset-subordinate-passwords'] },
  { prefix: '/payroll/settings/users', permission: ['manager-users', 'reset-subordinate-passwords'] },
  { prefix: '/payroll/settings/country', permission: 'view-country' },
  { prefix: '/payroll/settings/institution', permission: 'view-institution' },
  { prefix: '/payroll/settings/job-titles', permission: 'view-job-title' },
  { prefix: '/payroll/settings/pool-distribution-types', permission: 'view-pool-distribution-types' },
  { prefix: '/payroll/settings/relationship', permission: 'view-relationship' },
  { prefix: '/payroll/settings/account-mapping', permission: 'view-account-mappings' },
  { prefix: '/payroll/settings/tax-calculator-rates', permission: 'view-tax-calculator' },
  { prefix: '/payroll/settings/tax-calculator-accounts', permission: 'view-tax-calculator' },
  { prefix: '/payroll/employees', permission: 'view-employees' },
  { prefix: '/hr/employees', permission: 'view-employees' },
  { prefix: '/payroll/allowances', permission: 'view-payroll-allowances' },
  { prefix: '/payroll', permission: 'view-payroll' },
  { prefix: '/payroll/timesheet', permission: 'view-timesheets' },
  { prefix: '/payroll/scheduler', permission: 'view-calendars' },
  { prefix: '/payroll/leaves', permission: 'view-leave' },
  { prefix: '/payroll/reports', permission: 'view-reports' },
  { prefix: '/core/reports', permission: 'view-reports' },
];

export function routeViewPermission(path: string): string | string[] | null {
  const match = ROUTE_VIEW_PERMISSIONS.find(({ prefix }) =>
    path === prefix || path.startsWith(`${prefix}/`),
  );

  return match?.permission ?? null;
}

export function hasRoutePermission(
  userPermissions: string[],
  required: string | string[] | null | undefined,
): boolean {
  if (!required) {
    return true;
  }

  const requiredList = Array.isArray(required) ? required : [required];

  return requiredList.some((permission) => userPermissions.includes(permission));
}
