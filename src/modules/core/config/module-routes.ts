/** Canonical frontend paths (module-prefixed by owning application module). */
export const MODULE_ROUTES = {
  dashboard: '/',
  core: '/core',
  hr: '/hr',
  admin: '/admin',
  payroll: '/payroll',
  overview: '/payroll/overview',
  timesheet: '/payroll/timesheet',
  employees: '/hr/employees',
  payrollEmployees: '/payroll/employees',
  scheduler: '/payroll/scheduler',
  leaves: '/payroll/leaves',
  reports: '/payroll/reports',
  settings: '/payroll/settings',
  adminSettings: '/admin/settings',
} as const;

export function payrollPath(segment: string): string {
  return `/payroll/${segment.replace(/^\//, '')}`;
}

export function reportPath(reportId: string): string {
  return `${MODULE_ROUTES.reports}/${reportId}`;
}

/** Resolve employees base path from the current location so module context is preserved. */
export function employeesBaseFromPath(path: string): string {
  if (path === MODULE_ROUTES.payrollEmployees || path.startsWith(`${MODULE_ROUTES.payrollEmployees}/`)) {
    return MODULE_ROUTES.payrollEmployees;
  }

  return MODULE_ROUTES.employees;
}

export function employeePath(id?: string, currentPath?: string): string {
  const base = currentPath ? employeesBaseFromPath(currentPath) : MODULE_ROUTES.employees;
  return id ? `${base}/${id}` : base;
}

export function leavesPath(segment?: string): string {
  return segment ? `${MODULE_ROUTES.leaves}/${segment}` : MODULE_ROUTES.leaves;
}

export function settingsPath(segment?: string): string {
  return segment ? `${MODULE_ROUTES.settings}/${segment}` : MODULE_ROUTES.settings;
}

export function adminSettingsPath(segment?: string): string {
  return segment ? `${MODULE_ROUTES.adminSettings}/${segment}` : MODULE_ROUTES.adminSettings;
}

/** Match current or legacy unprefixed / payroll-prefixed paths during transition. */
export function pathInModule(path: string, moduleSegment: string): boolean {
  return (
    path.startsWith(`/payroll/${moduleSegment}`) ||
    path.startsWith(`/hr/${moduleSegment}`) ||
    path.startsWith(`/core/${moduleSegment}`) ||
    path.startsWith(`/admin/${moduleSegment}`) ||
    path.startsWith(`/${moduleSegment}`)
  );
}
