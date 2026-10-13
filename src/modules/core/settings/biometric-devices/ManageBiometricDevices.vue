<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6" data-onboarding="admin-settings">Biometric devices</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Register Hikvision terminals such as the DS-K1T342. The device pushes attendance
          events to this app (HTTP Push / ISUP key). Live status uses heartbeats and the
          last accepted event. Buffered punches sent after a network outage are accepted
          once, using the event id.
        </div>
      </q-card-section>
    </q-card>

    <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded dense>
      {{ store.error }}
    </q-banner>

    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="text-subtitle1">Devices</div>
        <q-space />
        <q-chip dense outline color="positive" text-color="positive">
          {{ onlineCount }} online
        </q-chip>
        <q-btn
          color="primary"
          unelevated
          no-caps
          icon="add"
          label="Add device"
          :disable="store.isSaving"
          @click="openCreate"
        />
      </q-card-section>
      <q-separator />
      <q-table
        flat
        :rows="store.devices"
        :columns="columns"
        row-key="id"
        :loading="store.isLoading"
        hide-pagination
        :pagination="{ rowsPerPage: 0 }"
      >
        <template #body-cell-status="props">
          <q-td :props="props">
            <q-chip
              dense
              square
              :color="statusColor(props.row.status)"
              text-color="white"
              :label="statusLabel(props.row.status)"
            />
          </q-td>
        </template>
        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-toggle
              :model-value="props.row.isActive"
              :disable="store.isSaving"
              @update:model-value="(value) => toggleActive(props.row, value)"
            />
          </q-td>
        </template>
        <template #body-cell-actions="props">
          <q-td :props="props" class="text-right">
            <q-btn flat dense round icon="edit" aria-label="Edit" @click="openEdit(props.row)" />
            <q-btn
              flat
              dense
              round
              icon="vpn_key"
              aria-label="Rotate token"
              @click="rotateToken(props.row)"
            />
            <q-btn
              flat
              dense
              round
              icon="delete"
              color="negative"
              aria-label="Delete"
              @click="confirmDelete(props.row)"
            />
          </q-td>
        </template>
        <template #no-data>
          <div class="full-width text-center q-pa-lg text-grey-7">
            No biometric devices yet. Add a DS-K1T342 to receive push events.
          </div>
        </template>
      </q-table>
    </q-card>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 420px; max-width: 520px">
        <q-card-section class="row items-center">
          <div class="text-h6">{{ editing ? 'Edit device' : 'Add device' }}</div>
          <q-space />
          <q-btn icon="close" flat round dense v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="save">
            <q-input v-model="form.name" label="Name" outlined dense :rules="[required]" />
            <q-input
              v-model="form.code"
              label="Device ID"
              hint="Must match the Device ID / ISUP account configured on the terminal"
              outlined
              dense
              :disable="Boolean(editing)"
              :rules="[required]"
            />
            <q-input v-model="form.model" label="Model" outlined dense />
            <q-input v-model="form.serialNumber" label="Serial number" outlined dense />
            <q-input v-model="form.location" label="Location" outlined dense />
            <q-select
              v-model="form.timezone"
              :options="timezoneOptions"
              label="Timezone"
              outlined
              dense
              emit-value
              map-options
            />
            <q-select
              v-model="form.protocol"
              :options="protocolOptions"
              label="Protocol"
              outlined
              dense
              emit-value
              map-options
            />
            <q-input
              v-model.number="form.heartbeatTimeoutSeconds"
              type="number"
              label="Heartbeat timeout (seconds)"
              outlined
              dense
            />
            <q-input v-model="form.notes" label="Notes" outlined dense type="textarea" autogrow />
            <q-toggle v-model="form.isActive" label="Active" />
            <div class="row justify-end q-gutter-sm">
              <q-btn flat no-caps label="Cancel" v-close-popup />
              <q-btn
                color="primary"
                unelevated
                no-caps
                type="submit"
                :label="editing ? 'Save' : 'Create'"
                :loading="store.isSaving"
              />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="tokenDialogOpen">
      <q-card style="min-width: 420px; max-width: 560px">
        <q-card-section>
          <div class="text-h6">Device token</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Copy this now. It is the ISUP / HTTP push key and will not be shown again.
          </div>
        </q-card-section>
        <q-card-section>
          <q-input :model-value="issuedToken" readonly outlined dense>
            <template #append>
              <q-btn flat dense icon="content_copy" aria-label="Copy token" @click="copy(issuedToken)" />
            </template>
          </q-input>
          <q-input class="q-mt-md" :model-value="issuedPushUrl" readonly outlined dense label="Push URL">
            <template #append>
              <q-btn flat dense icon="content_copy" aria-label="Copy push URL" @click="copy(issuedPushUrl)" />
            </template>
          </q-input>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat no-caps label="Done" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import {
  useBiometricDeviceStore,
  type BiometricDevice,
  type BiometricProtocol,
} from 'src/stores/biometric-device-store';

const store = useBiometricDeviceStore();
const $q = useQuasar();

const dialogOpen = ref(false);
const tokenDialogOpen = ref(false);
const editing = ref<BiometricDevice | null>(null);
const issuedToken = ref('');
const issuedPushUrl = ref('');
let pollTimer: ReturnType<typeof setInterval> | null = null;

const form = reactive({
  name: '',
  code: '',
  model: 'DS-K1T342',
  serialNumber: '',
  location: '',
  timezone: 'America/Belize',
  protocol: 'http_push' as BiometricProtocol,
  heartbeatTimeoutSeconds: 90,
  notes: '',
  isActive: true,
});

const timezoneOptions = [
  { label: 'America/Belize', value: 'America/Belize' },
  { label: 'America/Guatemala', value: 'America/Guatemala' },
  { label: 'America/Mexico_City', value: 'America/Mexico_City' },
  { label: 'UTC', value: 'UTC' },
];

const protocolOptions = [
  { label: 'HTTP Push (ISAPI host / Push SDK)', value: 'http_push' },
  { label: 'ISUP 5.0', value: 'isup' },
  { label: 'Local sync agent', value: 'agent' },
];

const columns = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' as const },
  { name: 'code', label: 'Device ID', field: 'code', align: 'left' as const },
  { name: 'model', label: 'Model', field: 'model', align: 'left' as const },
  { name: 'status', label: 'Status', field: 'status', align: 'left' as const },
  { name: 'lastSeenAt', label: 'Last seen', field: (row: BiometricDevice) => formatTime(row.lastSeenAt), align: 'left' as const },
  { name: 'lastEventAt', label: 'Last event', field: (row: BiometricDevice) => formatTime(row.lastEventAt), align: 'left' as const },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'left' as const },
  { name: 'actions', label: '', field: 'id', align: 'right' as const },
];

const onlineCount = computed(
  () => store.devices.filter((device) => device.status === 'online').length,
);

onMounted(async () => {
  await store.fetchDevices().catch(() => undefined);
  pollTimer = setInterval(() => {
    void store.fetchDevices().catch(() => undefined);
  }, 10000);
});

onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer);
  }
});

function required(value: string) {
  return !!value?.trim() || 'Required';
}

function statusColor(status: string) {
  if (status === 'online') return 'positive';
  if (status === 'offline') return 'negative';
  return 'grey';
}

function statusLabel(status: string) {
  if (status === 'online') return 'Live';
  if (status === 'offline') return 'Offline';
  return 'Unknown';
}

function formatTime(value: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function resetForm() {
  form.name = '';
  form.code = '';
  form.model = 'DS-K1T342';
  form.serialNumber = '';
  form.location = '';
  form.timezone = 'America/Belize';
  form.protocol = 'http_push';
  form.heartbeatTimeoutSeconds = 90;
  form.notes = '';
  form.isActive = true;
}

function openCreate() {
  editing.value = null;
  resetForm();
  dialogOpen.value = true;
}

function openEdit(device: BiometricDevice) {
  editing.value = device;
  form.name = device.name;
  form.code = device.code;
  form.model = device.model;
  form.serialNumber = device.serialNumber ?? '';
  form.location = device.location ?? '';
  form.timezone = device.timezone;
  form.protocol = device.protocol;
  form.heartbeatTimeoutSeconds = device.heartbeatTimeoutSeconds;
  form.notes = device.notes ?? '';
  form.isActive = device.isActive;
  dialogOpen.value = true;
}

async function save() {
  try {
    if (editing.value) {
      await store.updateDevice(editing.value.id, {
        name: form.name.trim(),
        model: form.model.trim(),
        serialNumber: form.serialNumber.trim() || null,
        location: form.location.trim() || null,
        timezone: form.timezone,
        protocol: form.protocol,
        heartbeatTimeoutSeconds: Number(form.heartbeatTimeoutSeconds) || 90,
        notes: form.notes.trim() || null,
        isActive: form.isActive,
      });
      $q.notify({ type: 'positive', message: 'Device updated.' });
    } else {
      const created = await store.createDevice({
        code: form.code.trim(),
        name: form.name.trim(),
        model: form.model.trim() || 'DS-K1T342',
        serialNumber: form.serialNumber.trim() || null,
        location: form.location.trim() || null,
        timezone: form.timezone,
        protocol: form.protocol,
        heartbeatTimeoutSeconds: Number(form.heartbeatTimeoutSeconds) || 90,
        notes: form.notes.trim() || null,
        isActive: form.isActive,
      });
      issuedToken.value = created.authToken ?? store.lastIssuedToken ?? '';
      issuedPushUrl.value = created.pushUrl;
      tokenDialogOpen.value = true;
    }
    dialogOpen.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to save device.',
    });
  }
}

async function toggleActive(device: BiometricDevice, isActive: boolean) {
  try {
    await store.updateDevice(device.id, { isActive, code: device.code, name: device.name });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to update device.',
    });
  }
}

async function rotateToken(device: BiometricDevice) {
  try {
    const token = await store.rotateToken(device.id);
    issuedToken.value = token;
    issuedPushUrl.value = device.pushUrl;
    tokenDialogOpen.value = true;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to rotate token.',
    });
  }
}

function confirmDelete(device: BiometricDevice) {
  $q.dialog({
    title: 'Delete device',
    message: `Remove ${device.name}? Push events from this terminal will be rejected.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteDevice(device.id);
        $q.notify({ type: 'positive', message: 'Device deleted.' });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Unable to delete device.',
        });
      }
    })();
  });
}

async function copy(value: string) {
  try {
    await navigator.clipboard.writeText(value);
    $q.notify({ type: 'positive', message: 'Copied.' });
  } catch {
    $q.notify({ type: 'negative', message: 'Unable to copy.' });
  }
}
</script>
