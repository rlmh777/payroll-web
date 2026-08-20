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

export const ROUTE_VIEW_PERMISSIONS: Array<{ prefix: string; permission: string }> = [
  { prefix: '/settings/district', permission: 'view-district' },
  { prefix: '/settings/locality', permission: 'view-locality' },
  { prefix: '/settings/department', permission: 'view-department' },
  { prefix: '/settings/country', permission: 'view-country' },
  { prefix: '/settings/institution', permission: 'view-institution' },
  { prefix: '/settings/job-titles', permission: 'view-job-title' },
  { prefix: '/settings/pool-distribution-types', permission: 'view-pool-distribution-types' },
  { prefix: '/settings/relationship', permission: 'view-relationship' },
  { prefix: '/settings/roles', permission: 'view-roles' },
  { prefix: '/settings/menu', permission: 'view-menu' },
  { prefix: '/settings/users', permission: 'manager-users' },
  { prefix: '/settings/account-mapping', permission: 'view-account-mappings' },
  { prefix: '/settings/tax-calculator-rates', permission: 'view-tax-calculator' },
  { prefix: '/settings/tax-calculator-accounts', permission: 'view-tax-calculator' },
  { prefix: '/settings/database-backup', permission: 'view-database-backup' },
  { prefix: '/employees', permission: 'view-employees' },
  { prefix: '/payroll/allowances', permission: 'view-payroll-allowances' },
  { prefix: '/payroll', permission: 'view-payroll' },
  { prefix: '/timesheet', permission: 'view-timesheets' },
  { prefix: '/scheduler', permission: 'view-calendars' },
  { prefix: '/leaves', permission: 'view-leave' },
  { prefix: '/reports', permission: 'view-reports' },
];

export function routeViewPermission(path: string): string | null {
  const match = ROUTE_VIEW_PERMISSIONS.find(({ prefix }) =>
    path === prefix || path.startsWith(`${prefix}/`),
  );

  return match?.permission ?? null;
}
