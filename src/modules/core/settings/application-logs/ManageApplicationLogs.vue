<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6" data-onboarding="admin-settings">Application logs</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Read Laravel API logs from
          <span class="text-weight-medium">storage/logs</span>
          (channel
          <span class="text-weight-medium">{{ store.payload?.channel || '—' }}</span>).
          Clearing empties the selected file. If the API logs to stderr (typical on Azure),
          files here may be empty — use the container logs instead.
        </div>
      </q-card-section>
      <q-card-section v-if="store.payload" class="q-pt-none row items-end q-col-gutter-md">
        <div class="col-6 col-md-2">
          <div class="text-caption text-grey-7">Current file</div>
          <div class="text-body1 ellipsis">{{ store.payload.file || 'None' }}</div>
        </div>
        <div class="col-6 col-md-2">
          <div class="text-caption text-grey-7">Size</div>
          <div class="text-body1">{{ formatBytes(store.payload.sizeBytes) }}</div>
        </div>
        <div class="col-6 col-md-3">
          <div class="text-caption text-grey-7">Last modified</div>
          <div class="text-body1">{{ formatTime(store.payload.modifiedAt) }}</div>
        </div>
        <div class="col-6 col-md-2">
          <div class="text-caption text-grey-7">Entries shown</div>
          <div class="text-body1">{{ store.payload.entries.length }}</div>
        </div>
        <div class="col-12 col-md-3 row justify-md-end no-wrap q-gutter-sm">
          <q-toggle v-model="autoRefresh" dense label="Auto" />
          <q-btn
            outline
            color="primary"
            icon="refresh"
            label="Refresh"
            no-caps
            :loading="store.isLoading"
            :disable="store.isClearing"
            @click="reload"
          />
          <q-btn
            v-if="canCrud"
            color="negative"
            icon="delete_sweep"
            label="Clear"
            no-caps
            :loading="store.isClearing"
            :disable="store.isLoading || !selectedFile"
            @click="confirmClear"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded dense>
      {{ store.error }}
    </q-banner>

    <q-card flat bordered>
      <q-card-section class="row q-col-gutter-sm">
        <div class="col-12 col-sm-6 col-md-4">
          <q-select
            v-model="selectedFile"
            :options="fileOptions"
            emit-value
            map-options
            outlined
            dense
            label="Log file"
            :disable="store.isLoading || fileOptions.length === 0"
            @update:model-value="reload"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-select
            v-model="lines"
            :options="lineOptions"
            emit-value
            map-options
            outlined
            dense
            label="Last lines"
            :disable="store.isLoading"
            @update:model-value="reload"
          />
        </div>
        <div class="col-6 col-md-2">
          <q-select
            v-model="level"
            :options="levelOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Level"
            :disable="store.isLoading"
            @update:model-value="reload"
          />
        </div>
        <div class="col-12 col-md-4">
          <q-input
            v-model="search"
            outlined
            dense
            clearable
            debounce="400"
            label="Search"
            :disable="store.isLoading"
            @update:model-value="reload"
          >
            <template #append>
              <q-icon name="search" />
            </template>
          </q-input>
        </div>
      </q-card-section>

      <q-separator />

      <q-tabs v-model="tab" dense active-color="primary" indicator-color="primary" align="left">
        <q-tab name="entries" label="Entries" />
        <q-tab name="raw" label="Raw" />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="entries" class="q-pa-none">
          <q-inner-loading :showing="store.isLoading && !store.payload" />
          <q-banner
            v-if="store.payload?.truncated"
            class="bg-warning text-dark"
            dense
          >
            Only the last {{ lines }} lines (up to 5 MB) are loaded. Increase the line count to see more.
          </q-banner>
          <q-scroll-area class="log-scroll">
            <q-list v-if="store.payload?.entries.length" separator>
              <q-expansion-item
                v-for="(entry, index) in store.payload.entries"
                :key="`${entry.timestamp}-${index}`"
                dense
                header-class="log-entry-header"
              >
                <template #header>
                  <q-item-section side>
                    <q-badge :color="levelColor(entry.level)" :label="entry.level.toUpperCase()" />
                  </q-item-section>
                  <q-item-section>
                    <q-item-label class="ellipsis">{{ entryPreview(entry) }}</q-item-label>
                    <q-item-label caption>{{ entryCaption(entry) }}</q-item-label>
                  </q-item-section>
                </template>
                <pre class="log-raw q-pa-md q-ma-none">{{ entry.raw }}</pre>
              </q-expansion-item>
            </q-list>
            <div v-else class="text-grey-7 q-pa-lg text-center">
              {{ emptyMessage }}
            </div>
          </q-scroll-area>
        </q-tab-panel>
        <q-tab-panel name="raw" class="q-pa-none">
          <q-scroll-area class="log-scroll">
            <pre class="log-raw q-pa-md q-ma-none">{{ store.payload?.content || emptyMessage }}</pre>
          </q-scroll-area>
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useApplicationLogStore, type ApplicationLogEntry } from '@core/stores/application-log-store';
import { useCrudPermission } from '@core/composables/useCrudPermission';
import { confirmSensitiveAction } from '@core/composables/useSensitiveActionConfirm';

defineProps<{ title?: string }>();

const $q = useQuasar();
const store = useApplicationLogStore();
const { canCrud } = useCrudPermission('applicationLogs');

const selectedFile = ref<string | null>(null);
const lines = ref(500);
const level = ref<string | null>(null);
const search = ref('');
const tab = ref('entries');
const autoRefresh = ref(false);

const lineOptions = [
  { label: '200', value: 200 },
  { label: '500', value: 500 },
  { label: '1,000', value: 1000 },
  { label: '2,000', value: 2000 },
  { label: '5,000', value: 5000 },
];

const levelOptions = [
  { label: 'Debug', value: 'debug' },
  { label: 'Info', value: 'info' },
  { label: 'Notice', value: 'notice' },
  { label: 'Warning', value: 'warning' },
  { label: 'Error', value: 'error' },
  { label: 'Critical', value: 'critical' },
  { label: 'Alert', value: 'alert' },
  { label: 'Emergency', value: 'emergency' },
];

const fileOptions = computed(() =>
  (store.payload?.files ?? []).map((file) => ({
    label: `${file.name} (${formatBytes(file.sizeBytes)})`,
    value: file.name,
  })),
);

const emptyMessage = computed(() => {
  if (!store.payload) {
    return 'Loading logs…';
  }
  if ((store.payload.files ?? []).length === 0) {
    return 'No Laravel log files were found in storage/logs.';
  }
  return 'No log entries match the current filters.';
});

let refreshTimer: ReturnType<typeof setInterval> | null = null;

async function reload() {
  try {
    await store.fetchLogs({
      ...(selectedFile.value ? { file: selectedFile.value } : {}),
      lines: lines.value,
      ...(search.value.trim() ? { search: search.value } : {}),
      ...(level.value ? { level: level.value } : {}),
    });
    if (!selectedFile.value && store.payload?.file) {
      selectedFile.value = store.payload.file;
    }
  } catch {
    // Store surfaces the error banner.
  }
}

function confirmClear() {
  const file = selectedFile.value;
  void (async () => {
    const confirmation = await confirmSensitiveAction({
      action: 'application_log_clear',
      context: { file: file || null },
      title: 'Clear application logs?',
      message: file
        ? `This empties ${file}. The file stays on disk so Laravel can keep writing to it.`
        : 'This empties every Laravel log file in storage/logs.',
      confirmLabel: 'Clear logs',
    });
    if (!confirmation) {
      return;
    }

    try {
      await store.clearLogs(file, confirmation);
      $q.notify({ type: 'positive', message: 'Application logs cleared.' });
      await reload();
    } catch (error) {
      $q.notify({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Unable to clear logs.',
      });
    }
  })();
}

function entryPreview(entry: ApplicationLogEntry): string {
  const first = (entry.message || entry.raw).split('\n')[0] ?? '';
  return first.length > 180 ? `${first.slice(0, 177)}…` : first;
}

function entryCaption(entry: ApplicationLogEntry): string {
  const parts = [entry.timestamp, entry.environment].filter(Boolean);
  return parts.join(' · ');
}

function levelColor(levelName: string): string {
  if (['error', 'critical', 'alert', 'emergency'].includes(levelName)) {
    return 'negative';
  }
  if (levelName === 'warning') {
    return 'warning';
  }
  if (levelName === 'info' || levelName === 'notice') {
    return 'info';
  }
  return 'grey';
}

function formatBytes(bytes: number | null | undefined): string {
  const value = Number(bytes ?? 0);
  if (value < 1024) {
    return `${value} B`;
  }
  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatTime(value: string | null | undefined): string {
  if (!value) {
    return '—';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

watch(autoRefresh, (enabled) => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  if (enabled) {
    refreshTimer = setInterval(() => {
      void reload();
    }, 8000);
  }
});

onMounted(() => {
  void reload();
});

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
});
</script>

<style scoped>
.log-scroll {
  height: min(52vh, 640px);
}

.log-raw {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  font-size: 0.78rem;
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
  background: rgba(0, 0, 0, 0.03);
}

.log-entry-header {
  align-items: flex-start;
}
</style>
