import { useAuthStore } from '@core/stores/auth';
import { useCalendarStore } from '@hr/stores/calendar-store';
import { useSchedulerStore } from '@hr/stores/scheduler-store';

export async function prepareSchedulerEmployees(options?: { force?: boolean }): Promise<void> {
  const authStore = useAuthStore();
  authStore.checkAuth();
  await authStore.ensureUser();

  if (!authStore.user) {
    return;
  }

  const calendarStore = useCalendarStore();
  const schedulerStore = useSchedulerStore();
  const userId = authStore.user?.id ? String(authStore.user.id) : null;

  if (userId && (options?.force === true || !calendarStore.currentEmployee)) {
    await calendarStore.fetchEmployeeByUserId(userId, { context: 'scheduler' });
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

  await schedulerStore.ensureEmployeesLoaded(calendarStore.currentEmployee ?? null);
}
