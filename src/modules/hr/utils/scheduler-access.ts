import { useAuthStore } from '@core/stores/auth';

function resolvePermissions(permissions?: string[] | null): string[] {
  if (permissions) {
    return permissions;
  }

  const authStore = useAuthStore();
  return authStore.user?.permissions ?? [];
}

function hasPermission(permissions: string[], permission: string): boolean {
  return permissions.includes(permission);
}

/** Company-wide employee list (HR / payroll admin via permissions). */
export function canViewAllSchedulerEmployees(permissions?: string[] | null): boolean {
  const perms = resolvePermissions(permissions);
  return (
    hasPermission(perms, 'employees-crud')
    || hasPermission(perms, 'pay-employees-crud')
  );
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
