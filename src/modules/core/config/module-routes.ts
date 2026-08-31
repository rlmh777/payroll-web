/** Canonical frontend paths (module-prefixed under payroll for single-module deployment). */
export const MODULE_ROUTES = {
  dashboard: '/',
  payroll: '/payroll',
  overview: '/payroll/overview',
  timesheet: '/payroll/timesheet',
  employees: '/payroll/employees',
  scheduler: '/payroll/scheduler',
  leaves: '/payroll/leaves',
  reports: '/payroll/reports',
  settings: '/payroll/settings',
} as const;

export function payrollPath(segment: string): string {
  return `/payroll/${segment.replace(/^\//, '')}`;
}

export function reportPath(reportId: string): string {
  return `${MODULE_ROUTES.reports}/${reportId}`;
}

export function employeePath(id?: string): string {
  return id ? `${MODULE_ROUTES.employees}/${id}` : MODULE_ROUTES.employees;
}

export function leavesPath(segment?: string): string {
  return segment ? `${MODULE_ROUTES.leaves}/${segment}` : MODULE_ROUTES.leaves;
}

export function settingsPath(segment?: string): string {
  return segment ? `${MODULE_ROUTES.settings}/${segment}` : MODULE_ROUTES.settings;
}

/** Match current or legacy unprefixed paths during transition. */
export function pathInModule(path: string, moduleSegment: string): boolean {
  return (
    path.startsWith(`/payroll/${moduleSegment}`) ||
    path.startsWith(`/${moduleSegment}`)
  );
}
