import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

export interface DatabaseBackupCreator {
  id: string;
  name?: string | null;
  email?: string | null;
}

export interface DatabaseBackup {
  id: string;
  filename: string;
  disk: string;
  path: string;
  type: 'manual' | 'scheduled' | 'uploaded';
  label?: string | null;
  size_bytes: number;
  checksum?: string | null;
  status: 'pending' | 'completed' | 'failed';
  error_message?: string | null;
  created_by?: string | null;
  completed_at?: string | null;
  created_at?: string | null;
  creator?: DatabaseBackupCreator | null;
}

export interface DatabaseBackupSettings {
  enabled: boolean;
  retentionDays: number;
  maxBackups: number;
  scheduleTimes: string[];
  timezone: string;
  backupCount: number;
  totalSizeBytes: number;
}

export const useDatabaseBackupStore = defineStore('databaseBackup', {
  state: () => ({
    backups: [] as DatabaseBackup[],
    settings: null as DatabaseBackupSettings | null,
    isLoading: false,
    isCreating: false,
    isRestoring: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(json = true): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = {};
      if (json) headers['Content-Type'] = 'application/json';
      if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;
      return headers;
    },

    async fetchBackups() {
      this.isLoading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/database-backups`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) throw new Error('Failed to load database backups');
        this.backups = await response.json();
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Error loading backups';
      } finally {
        this.isLoading = false;
      }
    },

    async fetchSettings() {
      const response = await fetch(`${API_URL}/database-backups/settings`, {
        headers: this.buildHeaders(),
      });
      if (!response.ok) throw new Error('Failed to load backup settings');
      this.settings = await response.json();
    },

    async createBackup(label?: string) {
      this.isCreating = true;
      try {
        const response = await fetch(`${API_URL}/database-backups`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ label: label || null }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to create backup');
        }
        await Promise.all([this.fetchBackups(), this.fetchSettings()]);
        return body.data as DatabaseBackup;
      } finally {
        this.isCreating = false;
      }
    },

    async deleteBackup(id: string) {
      const response = await fetch(`${API_URL}/database-backups/${id}`, {
        method: 'DELETE',
        headers: this.buildHeaders(),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(body.message || 'Failed to delete backup');
      }
      this.backups = this.backups.filter((item) => item.id !== id);
      await this.fetchSettings();
    },

    async restoreBackup(id: string) {
      this.isRestoring = true;
      try {
        const response = await fetch(`${API_URL}/database-backups/${id}/restore`, {
          method: 'POST',
          headers: this.buildHeaders(),
          body: JSON.stringify({ confirmation: 'RESTORE' }),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to restore backup');
        }
      } finally {
        this.isRestoring = false;
      }
    },

    async restoreUpload(file: File) {
      this.isRestoring = true;
      try {
        const authStore = useAuthStore();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('confirmation', 'RESTORE');

        const headers: HeadersInit = {};
        if (authStore.token) headers.Authorization = `Bearer ${authStore.token}`;

        const response = await fetch(`${API_URL}/database-backups/restore-upload`, {
          method: 'POST',
          headers,
          body: formData,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to restore uploaded backup');
        }
        await Promise.all([this.fetchBackups(), this.fetchSettings()]);
      } finally {
        this.isRestoring = false;
      }
    },

    async downloadBackup(backup: DatabaseBackup) {
      const response = await fetch(`${API_URL}/database-backups/${backup.id}/download`, {
        headers: this.buildHeaders(false),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.message || 'Failed to download backup');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = backup.filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useDatabaseBackupStore, import.meta.hot));
}
