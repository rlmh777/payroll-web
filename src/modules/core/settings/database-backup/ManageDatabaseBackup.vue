<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Database Backup</div>
        <div class="text-body2 text-grey-7">
          Create, download, and restore PostgreSQL backups. Scheduled backups run
          {{ scheduleSummary }} and cycle automatically (keep
          {{ settings?.retentionDays ?? 30 }} days / max
          {{ settings?.maxBackups ?? 120 }} files).
        </div>
      </q-card-section>
      <q-card-section v-if="settings" class="q-pt-none row q-col-gutter-md">
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey-7">Schedule</div>
          <div class="text-body1">{{ settings.scheduleTimes.join(', ') || '—' }}</div>
          <div class="text-caption text-grey-6">{{ settings.timezone }}</div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey-7">Stored backups</div>
          <div class="text-body1">{{ settings.backupCount }}</div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey-7">Total size</div>
          <div class="text-body1">{{ formatBytes(settings.totalSizeBytes) }}</div>
        </div>
        <div class="col-12 col-sm-6 col-md-3">
          <div class="text-caption text-grey-7">Status</div>
          <div class="text-body1">
            <q-badge :color="settings.enabled ? 'positive' : 'negative'">
              {{ settings.enabled ? 'Enabled' : 'Disabled' }}
            </q-badge>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-space />
        <q-btn
          outline
          color="primary"
          icon="upload_file"
          label="Restore from file"
          :disable="store.isCreating || store.isRestoring"
          @click="pickUpload"
        />
        <q-btn
          color="primary"
          icon="backup"
          label="Create backup"
          :loading="store.isCreating"
          :disable="store.isRestoring"
          @click="onCreate"
        />
        <input
          ref="fileInput"
          type="file"
          accept=".dump,application/octet-stream"
          class="hidden-input"
          @change="onFileSelected"
        />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Backups"
          :rows="store.backups"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading || store.isRestoring"
          no-data-label="No backups yet"
          :pagination="{ rowsPerPage: 20 }"
        >
          <template #body-cell-type="props">
            <q-td :props="props">
              <q-badge :color="typeColor(props.row.type)">{{ props.row.type }}</q-badge>
            </q-td>
          </template>
          <template #body-cell-status="props">
            <q-td :props="props">
              <q-badge :color="statusColor(props.row.status)">{{ props.row.status }}</q-badge>
              <q-tooltip v-if="props.row.error_message">{{ props.row.error_message }}</q-tooltip>
            </q-td>
          </template>
          <template #body-cell-size="props">
            <q-td :props="props">{{ formatBytes(props.row.size_bytes) }}</q-td>
          </template>
          <template #body-cell-created="props">
            <q-td :props="props">{{ formatDate(props.row.created_at) }}</q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn
                flat
                round
                dense
                icon="download"
                color="primary"
                size="sm"
                :disable="props.row.status !== 'completed'"
                @click="onDownload(props.row)"
              >
                <q-tooltip>Download</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="restore"
                color="warning"
                size="sm"
                :disable="props.row.status !== 'completed' || store.isRestoring"
                @click="onRestore(props.row)"
              >
                <q-tooltip>Restore</q-tooltip>
              </q-btn>
              <q-btn
                flat
                round
                dense
                icon="delete"
                color="negative"
                size="sm"
                :disable="store.isRestoring"
                @click="onDelete(props.row)"
              >
                <q-tooltip>Delete</q-tooltip>
              </q-btn>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import {
  useDatabaseBackupStore,
  type DatabaseBackup,
} from 'src/stores/database-backup-store';

const store = useDatabaseBackupStore();
const $q = useQuasar();
const fileInput = ref<HTMLInputElement | null>(null);

const settings = computed(() => store.settings);
const scheduleSummary = computed(() => {
  const times = settings.value?.scheduleTimes ?? [];
  if (times.length === 0) return 'on a custom schedule';
  return `${times.length}× daily (${times.join(', ')})`;
});

const columns: QTableProps['columns'] = [
  { name: 'filename', label: 'File', field: 'filename', align: 'left', sortable: true },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'status', label: 'Status', field: 'status', align: 'left', sortable: true },
  { name: 'size', label: 'Size', field: 'size_bytes', align: 'right', sortable: true },
  { name: 'label', label: 'Label', field: 'label', align: 'left' },
  { name: 'created', label: 'Created', field: 'created_at', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function formatBytes(bytes: number | null | undefined): string {
  const value = Number(bytes || 0);
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  if (value < 1024 * 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  return `${(value / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function typeColor(type: string): string {
  if (type === 'scheduled') return 'teal';
  if (type === 'uploaded') return 'purple';
  return 'primary';
}

function statusColor(status: string): string {
  if (status === 'completed') return 'positive';
  if (status === 'failed') return 'negative';
  return 'grey';
}

async function refresh() {
  await Promise.all([store.fetchBackups(), store.fetchSettings()]);
}

async function onCreate() {
  try {
    await store.createBackup();
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Database backup created.',
    });
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to create backup.',
    });
  }
}

function onDownload(row: DatabaseBackup) {
  void (async () => {
    try {
      await store.downloadBackup(row);
    } catch (error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: error instanceof Error ? error.message : 'Download failed.',
      });
    }
  })();
}

function onRestore(row: DatabaseBackup) {
  $q.dialog({
    title: 'Restore database?',
    message:
      `This will replace the current database with "${row.filename}". ` +
      'Type RESTORE to confirm. Active users may be interrupted.',
    prompt: {
      model: '',
      type: 'text',
      label: 'Type RESTORE',
    },
    cancel: true,
    ok: { label: 'Restore', color: 'warning' },
    persistent: true,
  }).onOk((value: string) => {
    if (value !== 'RESTORE') {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'warning',
        message: 'Confirmation text must be exactly RESTORE.',
      });
      return;
    }

    void (async () => {
      try {
        await store.restoreBackup(row.id);
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Database restored. Refresh the app if anything looks stale.',
        });
        await refresh();
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Restore failed.',
        });
      }
    })();
  });
}

function onDelete(row: DatabaseBackup) {
  $q.dialog({
    title: 'Delete backup?',
    message: `Delete "${row.filename}"? This cannot be undone.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteBackup(row.id);
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Backup deleted.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

function pickUpload() {
  fileInput.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;

  $q.dialog({
    title: 'Restore from uploaded file?',
    message:
      `Upload and restore "${file.name}"? This replaces the current database. ` +
      'Type RESTORE to confirm.',
    prompt: {
      model: '',
      type: 'text',
      label: 'Type RESTORE',
    },
    cancel: true,
    ok: { label: 'Restore', color: 'warning' },
    persistent: true,
  }).onOk((value: string) => {
    if (value !== 'RESTORE') {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'warning',
        message: 'Confirmation text must be exactly RESTORE.',
      });
      return;
    }

    void (async () => {
      try {
        await store.restoreUpload(file);
        $q.notify({
          color: 'positive',
          position: 'top',
          icon: 'check_circle',
          message: 'Database restored from uploaded file.',
        });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          icon: 'error',
          message: error instanceof Error ? error.message : 'Upload restore failed.',
        });
      }
    })();
  });
}

onMounted(() => {
  void refresh();
});
</script>

<style scoped>
.hidden-input {
  display: none;
}
</style>
