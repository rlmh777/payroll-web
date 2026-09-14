import { useAuthStore } from '@core/stores/auth';

function resolvePermissions(permissions?: string[] | null): string[] {
  if (permissions) {
    return permissions;
  }

  const authStore = useAuthStore();
  return authStore.user?.permissions ?? [];
}

function resolveRoles(): string[] {
  const authStore = useAuthStore();
  const user = authStore.user;
  if (!user) {
    return [];
  }

  if (user.roles?.length) {
    return user.roles;
  }

  return user.role ? [user.role] : [];
}

function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

/** Company-wide employee list (HR / payroll admin / GM). */
export function canViewAllSchedulerEmployees(permissions?: string[] | null): boolean {
  const perms = resolvePermissions(permissions);
  if (
    hasPermission(perms, 'employees-crud')
    || hasPermission(perms, 'pay-employees-crud')
    || hasPermission(perms, 'scheduler-daily-metrics-crud')
  ) {
    return true;
  }

  return resolveRoles().some((role) => role === 'admin' || role === 'gm');
}

/** Can open scheduler/timesheet employee panes (company-wide or team scope). */
export function canManageSchedulerEmployees(permissions?: string[] | null): boolean {
  const perms = resolvePermissions(permissions);
  return (
    canViewAllSchedulerEmployees(perms)
    || hasPermission(perms, 'view-calendars')
    || hasPermission(perms, 'calendar-crud')
    || hasPermission(perms, 'view-timesheets')
    || hasPermission(perms, 'timesheets-crud')
    || hasPermission(perms, 'view-employees')
  );
}

/** Team lead / supervisor scope: can manage employees but not company-wide. */
export function isSchedulerSupervisor(permissions?: string[] | null): boolean {
  const perms = resolvePermissions(permissions);
  return !canViewAllSchedulerEmployees(perms) && canManageSchedulerEmployees(perms);
}

/** Edit optional per-day metrics under the scheduler header (GM / admin via permission). */
export function canEditSchedulerDailyMetrics(permissions?: string[] | null): boolean {
  return hasPermission(resolvePermissions(permissions), 'scheduler-daily-metrics-crud');
}

/** Create/edit company, department, or employee notices on the scheduler. */
export function canEditSchedulerNotices(permissions?: string[] | null): boolean {
  return hasPermission(resolvePermissions(permissions), 'calendar-crud');
}

/** Upload Excel to create future scheduled shifts (GM / supervisor with calendar write). */
export function canImportSchedulerShifts(permissions?: string[] | null): boolean {
  return hasPermission(resolvePermissions(permissions), 'calendar-crud');
}
