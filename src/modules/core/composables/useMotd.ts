import { onMounted, onUnmounted, watch } from 'vue';
import { Notify } from 'quasar';
import { useAuthStore } from 'src/stores/auth';
import {
  clearMotdFreshLogin,
  markDailyMotdChecked,
  peekMotdReason,
  runMotdClaim,
  shouldSkipDailyMotd,
} from '@core/utils/motd-session';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';
const TOAST_MS = 30_000;

function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function firstName(fullName: string | undefined): string {
  const token = (fullName ?? '').trim().split(/\s+/)[0];
  return token || 'there';
}

function localDate(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function showToast(name: string, text: string) {
  Notify.create({
    group: 'motd',
    message: text,
    caption: `${greeting()}, ${firstName(name)}`,
    icon: 'auto_awesome',
    color: 'teal-8',
    textColor: 'white',
    position: 'top',
    timeout: TOAST_MS,
    progress: true,
    actions: [{ icon: 'close', color: 'white', round: true, 'aria-label': 'Dismiss' }],
    classes: 'app-toast motd-toast',
  });
}

export function useMotd() {
  const authStore = useAuthStore();

  async function claimAndShow() {
    if (!authStore.isAuthenticated || !authStore.token) {
      return;
    }

    try {
      await runMotdClaim(async () => {
        const reason = peekMotdReason();
        const today = localDate();
        if (reason === 'daily' && shouldSkipDailyMotd(today)) {
          return;
        }
        const response = await fetch(`${API_URL}/user/motd`, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
          body: JSON.stringify({
            reason,
            localDate: today,
          }),
        });
        if (!response.ok) {
          return;
        }
        clearMotdFreshLogin();
        markDailyMotdChecked(today);
        const body = (await response.json().catch(() => ({}))) as {
          message?: { id?: string; text?: string } | null;
        };
        const text = body.message?.text?.trim();
        if (!text) {
          return;
        }
        showToast(authStore.user?.name ?? '', text);
      });
    } catch {
      // Stay silent if the welcome quote cannot be loaded.
    }
  }

  function onVisible() {
    if (document.visibilityState === 'visible') {
      void claimAndShow();
    }
  }

  watch(
    () => Boolean(authStore.isAuthenticated && authStore.token),
    (ready) => {
      if (ready) {
        void claimAndShow();
      }
    },
    { immediate: true },
  );

  onMounted(() => {
    document.addEventListener('visibilitychange', onVisible);
  });

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisible);
  });
}
