import { acceptHMRUpdate, defineStore } from 'pinia';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface AppNotification {
  id: string;
  type: string;
  message: string;
  employee_id?: string | null;
  employee_name?: string | null;
  work_date?: string | null;
  timesheet_id?: string | null;
  url?: string | null;
  read_at?: string | null;
  created_at?: string | null;
}

export const useNotificationStore = defineStore('notifications', {
  state: () => ({
    items: [] as AppNotification[],
    unreadCount: 0,
    isLoading: false,
    error: null as string | null,
  }),

  actions: {
    async fetchNotifications(): Promise<void> {
      this.isLoading = true;
      this.error = null;

      try {
        const authStore = useAuthStore();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (authStore.token) {
          headers.Authorization = `Bearer ${authStore.token}`;
        }

        const response = await fetch(`${API_URL}/notifications?per_page=20`, { headers });
        if (!response.ok) {
          throw new Error(`Failed to load notifications (${response.status})`);
        }

        const payload = await response.json();
        this.items = Array.isArray(payload.data) ? payload.data : [];
        this.unreadCount = Number(payload.unread_count ?? 0);
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load notifications';
      } finally {
        this.isLoading = false;
      }
    },

    async markAsRead(notificationId: string): Promise<void> {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return;
      }

      const item = this.items.find((entry) => entry.id === notificationId);
      if (item && !item.read_at) {
        item.read_at = new Date().toISOString();
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      }
    },

    async markAllAsRead(): Promise<void> {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'POST',
        headers,
      });

      if (!response.ok) {
        return;
      }

      const readAt = new Date().toISOString();
      this.items = this.items.map((item) => ({ ...item, read_at: item.read_at ?? readAt }));
      this.unreadCount = 0;
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationStore, import.meta.hot));
}
