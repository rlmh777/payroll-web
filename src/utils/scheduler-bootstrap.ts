import { useAuthStore } from 'src/stores/auth';
import { useCalendarStore } from 'src/stores/calendar-store';
import { useSchedulerStore } from 'src/stores/scheduler-store';

export async function prepareSchedulerEmployees(options?: { force?: boolean }): Promise<void> {
  const authStore = useAuthStore();
  authStore.checkAuth();
  await authStore.ensureUser();

  const role = authStore.user?.role;
  if (!role) {
    return;
  }

  const calendarStore = useCalendarStore();
  const schedulerStore = useSchedulerStore();

  if (authStore.user?.id) {
    await calendarStore.fetchEmployeeByUserId(String(authStore.user.id));
  }

  if (options?.force === true) {
    schedulerStore.setFilterEmployeeId(null);
  }

  const shouldLoad =
    options?.force === true ||
    !schedulerStore.hasLoadedEmployees ||
    schedulerStore.employees.length === 0;

  if (!shouldLoad) {
    return;
  }

  await schedulerStore.ensureEmployeesLoaded(role, calendarStore.currentEmployee ?? null);
}

export function resetSchedulerEmployeesIfLeaving(fromPath: string, toPath: string): void {
  const fromSchedulerContext = fromPath.startsWith('/scheduler');
  const toSchedulerContext = toPath.startsWith('/scheduler');

  if (fromSchedulerContext && !toSchedulerContext) {
    useSchedulerStore().resetEmployees();
  }
}
