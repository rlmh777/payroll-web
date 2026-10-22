import { onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';

const configuredMinutes = Number(
  import.meta.env.VITE_SESSION_TIMEOUT_MINUTES
  ?? process.env.VITE_SESSION_TIMEOUT_MINUTES
  ?? 480,
);
const SESSION_TIMEOUT_MS = (Number.isFinite(configuredMinutes) && configuredMinutes > 0
  ? configuredMinutes
  : 480) * 60 * 1000;
const VALIDATION_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVITY_STORAGE_KEY = 'payroll_session_activity_at';
const ACTIVITY_WRITE_INTERVAL_MS = 15 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const;

export function useSessionGuard() {
  const authStore = useAuthStore();

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let validationTimer: ReturnType<typeof setInterval> | null = null;
  let lastActivityAt = Date.now();
  let lastActivityWriteAt = 0;

  function clearTimers() {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }

    if (validationTimer) {
      clearInterval(validationTimer);
      validationTimer = null;
    }
  }

  function storedActivityAt(): number {
    const stored = Number(localStorage.getItem(ACTIVITY_STORAGE_KEY) || 0);

    return Number.isFinite(stored) ? stored : 0;
  }

  function latestActivityAt(): number {
    return Math.max(lastActivityAt, storedActivityAt());
  }

  function rememberActivity(at: number) {
    lastActivityAt = at;

    if (at - lastActivityWriteAt < ACTIVITY_WRITE_INTERVAL_MS) {
      return;
    }

    lastActivityWriteAt = at;
    localStorage.setItem(ACTIVITY_STORAGE_KEY, String(at));
  }

  function scheduleIdleLogout() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }

    if (!authStore.isAuthenticated) {
      return;
    }

    const elapsed = Date.now() - latestActivityAt();
    const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

    idleTimer = setTimeout(() => {
      if (Date.now() - latestActivityAt() < SESSION_TIMEOUT_MS) {
        scheduleIdleLogout();
        return;
      }

      authStore.handleSessionTimeout();
    }, remaining);
  }

  function recordActivity() {
    if (!authStore.isAuthenticated) {
      return;
    }

    rememberActivity(Date.now());
    scheduleIdleLogout();
  }

  function handleStorage(event: StorageEvent) {
    if (event.key !== ACTIVITY_STORAGE_KEY || !authStore.isAuthenticated) {
      return;
    }

    scheduleIdleLogout();
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== 'visible' || !authStore.isAuthenticated) {
      return;
    }

    if (Date.now() - latestActivityAt() >= SESSION_TIMEOUT_MS) {
      authStore.handleSessionTimeout();
      return;
    }

    void authStore.validateSession({ force: true });
    scheduleIdleLogout();
  }

  function startGuards() {
    clearTimers();
    lastActivityAt = Date.now();
    scheduleIdleLogout();

    validationTimer = setInterval(() => {
      if (!authStore.isAuthenticated || document.visibilityState !== 'visible') {
        return;
      }

      void authStore.validateSession();
    }, VALIDATION_INTERVAL_MS);

    rememberActivity(Date.now());

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorage);
  }

  function stopGuards() {
    clearTimers();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('storage', handleStorage);
  }

  onMounted(() => {
    watch(
      () => authStore.isAuthenticated,
      (isAuthenticated) => {
        if (isAuthenticated) {
          startGuards();
          void authStore.validateSession({ force: true });
        } else {
          stopGuards();
        }
      },
      { immediate: true },
    );
  });

  onUnmounted(() => {
    stopGuards();
  });
}
