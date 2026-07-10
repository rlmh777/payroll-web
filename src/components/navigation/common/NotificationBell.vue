<template>
  <q-btn flat dense round icon="notifications" aria-label="Notifications">
    <q-badge v-if="notificationStore.unreadCount > 0" color="red" floating rounded>
      {{ notificationStore.unreadCount > 9 ? '9+' : notificationStore.unreadCount }}
    </q-badge>

    <q-menu anchor="bottom right" self="top right" @before-show="loadNotifications">
      <q-list style="min-width: 320px; max-width: 420px">
        <q-item>
          <q-item-section>
            <q-item-label class="text-weight-medium">Notifications</q-item-label>
          </q-item-section>
          <q-item-section side>
            <q-btn
              v-if="notificationStore.unreadCount > 0"
              flat
              dense
              size="sm"
              label="Mark all read"
              @click.stop="markAllRead"
            />
          </q-item-section>
        </q-item>

        <q-separator />

        <q-item v-if="notificationStore.isLoading">
          <q-item-section class="text-center">
            <q-spinner color="primary" size="24px" />
          </q-item-section>
        </q-item>

        <template v-else-if="notificationStore.items.length">
          <q-item
            v-for="notification in notificationStore.items"
            :key="notification.id"
            clickable
            v-close-popup
            :class="notification.read_at ? '' : 'bg-blue-1'"
            @click="openNotification(notification)"
          >
            <q-item-section>
              <q-item-label>{{ notificationTitle(notification) }}</q-item-label>
              <q-item-label caption>{{ notification.message }}</q-item-label>
              <q-item-label v-if="notification.created_at" caption>
                {{ formatDate(notification.created_at) }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </template>

        <q-item v-else>
          <q-item-section class="text-grey-7">No notifications.</q-item-section>
        </q-item>
      </q-list>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { date } from 'quasar';
import { useNotificationStore, type AppNotification } from 'src/stores/notification-store';

const notificationStore = useNotificationStore();
const router = useRouter();

let refreshTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  void notificationStore.fetchNotifications();
  refreshTimer = setInterval(() => {
    void notificationStore.fetchNotifications();
  }, 60_000);
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});

function loadNotifications() {
  void notificationStore.fetchNotifications();
}

function notificationTitle(notification: AppNotification): string {
  if (notification.employee_name && notification.work_date) {
    return `${notification.employee_name} · ${notification.work_date}`;
  }

  return 'Timesheet issue';
}

function formatDate(value: string): string {
  return date.formatDate(value, 'MMM D, YYYY h:mm A');
}

async function openNotification(notification: AppNotification) {
  if (!notification.read_at) {
    await notificationStore.markAsRead(notification.id);
  }

  if (notification.url) {
    if (notification.timesheet_id) {
      void router.push({ path: notification.url, query: { issuesOnly: '1' } });
    } else {
      void router.push(notification.url);
    }
  }
}

function markAllRead() {
  void notificationStore.markAllAsRead();
}
</script>
