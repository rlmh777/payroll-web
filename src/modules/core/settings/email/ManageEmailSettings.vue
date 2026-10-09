<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="email-settings-card">
      <q-card-section>
        <div class="text-h6" data-onboarding="admin-settings">Email</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Configure how the application sends mail — contract expiry reminders, leave notices,
          password messages, and other templates. SMTP is used for real delivery; Log writes
          messages to the application log for local testing.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-toggle
            v-model="form.enabled"
            label="Send outbound email"
            :disable="store.isLoading || store.isSaving"
          />

          <q-select
            v-model="form.mailer"
            :options="mailerOptions"
            emit-value
            map-options
            label="Mailer"
            outlined
            :disable="store.isLoading || store.isSaving || !form.enabled"
          />

          <template v-if="form.mailer === 'smtp'">
            <q-input
              v-model="form.host"
              label="SMTP host"
              outlined
              :disable="disabled"
              :rules="[(value) => !!String(value || '').trim() || 'Host is required']"
            />
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="form.port"
                  type="number"
                  label="Port"
                  outlined
                  :disable="disabled"
                />
              </div>
              <div class="col-12 col-sm-8">
                <q-select
                  v-model="form.encryption"
                  :options="encryptionOptions"
                  emit-value
                  map-options
                  label="Encryption"
                  outlined
                  :disable="disabled"
                />
              </div>
            </div>
            <q-input
              v-model="form.username"
              label="Username (optional)"
              outlined
              :disable="disabled"
              autocomplete="off"
            />
            <q-input
              v-model="form.password"
              label="Password"
              :hint="
                store.settings?.passwordSet
                  ? 'Leave blank to keep the saved password.'
                  : 'Required if your SMTP server needs authentication.'
              "
              type="password"
              outlined
              autocomplete="new-password"
              :disable="disabled"
            />
          </template>

          <div v-else class="text-body2 text-grey-7">
            Messages are written to the application log instead of being delivered.
          </div>

          <q-input
            v-model="form.fromAddress"
            label="From address"
            outlined
            :disable="disabled"
            :rules="form.mailer === 'smtp' ? [(value) => !!String(value || '').trim() || 'From address is required'] : []"
          />
          <q-input
            v-model="form.fromName"
            label="From name"
            outlined
            :disable="disabled"
          />

          <q-input
            v-model="form.testTo"
            label="Send a test to"
            outlined
            :disable="disabled"
            hint="Uses the settings on this form without requiring a separate save."
          />

          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              label="Save"
              type="submit"
              :loading="store.isSaving"
              :disable="store.isLoading || store.isTesting"
            />
            <q-btn
              outline
              color="primary"
              label="Send test email"
              :loading="store.isTesting"
              :disable="store.isLoading || store.isSaving || !form.enabled"
              @click="sendTest"
            />
            <q-btn
              flat
              label="Reset"
              :disable="store.isLoading || store.isSaving || store.isTesting || !store.settings"
              @click="resetForm"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@core/stores/auth';
import {
  useMailSettingsStore,
  type MailEncryption,
  type Mailer,
  type MailSettingsPayload,
} from 'src/stores/mail-settings-store';

defineProps<{ title?: string }>();

const $q = useQuasar();
const authStore = useAuthStore();
const store = useMailSettingsStore();
const { settings } = storeToRefs(store);

const mailerOptions = [
  { label: 'SMTP', value: 'smtp' as Mailer },
  { label: 'Log (do not deliver)', value: 'log' as Mailer },
];

const encryptionOptions = [
  { label: 'STARTTLS (TLS)', value: 'tls' as MailEncryption },
  { label: 'SSL / SMTPS', value: 'ssl' as MailEncryption },
  { label: 'None', value: 'none' as MailEncryption },
];

const form = reactive({
  enabled: true,
  mailer: 'smtp' as Mailer,
  host: '',
  port: 587,
  username: '',
  password: '',
  encryption: 'tls' as MailEncryption,
  fromAddress: '',
  fromName: '',
  testTo: '',
});

const disabled = computed(() => store.isLoading || store.isSaving || !form.enabled);

function syncFormFromStore() {
  if (!settings.value) {
    return;
  }

  form.enabled = settings.value.enabled;
  form.mailer = settings.value.mailer;
  form.host = settings.value.host ?? '';
  form.port = settings.value.port || 587;
  form.username = settings.value.username ?? '';
  form.password = '';
  form.encryption = settings.value.encryption;
  form.fromAddress = settings.value.fromAddress ?? '';
  form.fromName = settings.value.fromName ?? '';
  if (!form.testTo) {
    form.testTo = authStore.user?.email ?? '';
  }
}

function resetForm() {
  syncFormFromStore();
}

function buildPayload(): MailSettingsPayload {
  const payload: MailSettingsPayload = {
    enabled: form.enabled,
    mailer: form.mailer,
    host: form.host.trim() || null,
    port: Number(form.port) || 587,
    username: form.username.trim() || null,
    encryption: form.encryption,
    fromAddress: form.fromAddress.trim() || null,
    fromName: form.fromName.trim() || null,
  };

  if (form.password.trim()) {
    payload.password = form.password.trim();
  }

  return payload;
}

async function save() {
  try {
    await store.updateSettings(buildPayload());
    form.password = '';
    $q.notify({ type: 'positive', message: 'Email settings saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save email settings.',
    });
  }
}

async function sendTest() {
  const to = form.testTo.trim();
  if (!to) {
    $q.notify({ type: 'negative', message: 'Enter an address to send the test email to.' });
    return;
  }

  const result = await store.testConnection({ ...buildPayload(), to });
  $q.notify({
    type: result.ok ? 'positive' : 'negative',
    message: result.message,
  });
}

watch(settings, syncFormFromStore, { immediate: true });

onMounted(async () => {
  if (!form.testTo) {
    form.testTo = authStore.user?.email ?? '';
  }
  const loaded = await store.fetchSettings();
  if (!loaded && store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
});
</script>

<style scoped>
.email-settings-card {
  max-width: 720px;
}
</style>
