import { onMounted, onUnmounted, watch } from 'vue';
import { useAuthStore } from 'src/stores/auth';

const SESSION_TIMEOUT_MS = Number(import.meta.env.VITE_SESSION_TIMEOUT_MINUTES ?? 120) * 60 * 1000;
const VALIDATION_INTERVAL_MS = 5 * 60 * 1000;
const ACTIVITY_EVENTS = ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const;

export function useSessionGuard() {
  const authStore = useAuthStore();

  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let validationTimer: ReturnType<typeof setInterval> | null = null;
  let lastActivityAt = Date.now();

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

  function scheduleIdleLogout() {
    if (idleTimer) {
      clearTimeout(idleTimer);
    }

    if (!authStore.isAuthenticated) {
      return;
    }

    const elapsed = Date.now() - lastActivityAt;
    const remaining = Math.max(0, SESSION_TIMEOUT_MS - elapsed);

    idleTimer = setTimeout(() => {
      authStore.handleSessionTimeout();
    }, remaining);
  }

  function recordActivity() {
    if (!authStore.isAuthenticated) {
      return;
    }

    lastActivityAt = Date.now();
    scheduleIdleLogout();
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== 'visible' || !authStore.isAuthenticated) {
      return;
    }

    if (Date.now() - lastActivityAt >= SESSION_TIMEOUT_MS) {
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

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, recordActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', handleVisibilityChange);
  }

  function stopGuards() {
    clearTimers();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
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
