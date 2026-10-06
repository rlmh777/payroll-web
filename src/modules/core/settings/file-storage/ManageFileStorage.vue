<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="file-storage-card">
      <q-card-section>
        <div class="text-h6" data-onboarding="admin-settings">File Storage</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Choose where uploaded documents, logos, attachments, and database backups
          are stored. Local keeps files on this app server (backups stay on the
          private disk). Azure Blob and S3 send new files to the container or bucket
          you configure. Existing files stay on the previous disk until they are
          re-uploaded.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-select
            v-model="form.driver"
            :options="driverOptions"
            emit-value
            map-options
            label="Storage driver"
            outlined
            :disable="store.isLoading || store.isSaving"
          />

          <template v-if="form.driver !== 'local'">
            <q-input
              v-model="form.container"
              :label="containerLabel"
              outlined
              :disable="store.isLoading || store.isSaving"
              :rules="[(value) => !!value?.trim() || `${containerLabel} is required`]"
            />

            <q-input
              v-model="form.accountName"
              :label="accountNameLabel"
              outlined
              :disable="store.isLoading || store.isSaving"
              :rules="[(value) => !!value?.trim() || `${accountNameLabel} is required`]"
            />

            <q-input
              v-model="form.accountKey"
              :label="accountKeyLabel"
              :hint="
                store.settings?.accountKeySet
                  ? 'Leave blank to keep the saved key.'
                  : 'Required the first time you connect.'
              "
              type="password"
              outlined
              autocomplete="new-password"
              :disable="store.isLoading || store.isSaving"
            />

            <q-input
              v-model="form.endpoint"
              label="Endpoint (optional)"
              hint="Leave blank for the provider default. Use a custom URL for Azurite, MinIO, or a private endpoint."
              outlined
              :disable="store.isLoading || store.isSaving"
            />

            <q-input
              v-model="form.prefix"
              label="Path prefix (optional)"
              outlined
              :disable="store.isLoading || store.isSaving"
            />

            <template v-if="form.driver === 's3'">
              <q-input
                v-model="form.region"
                label="Region"
                outlined
                :disable="store.isLoading || store.isSaving"
              />
              <q-toggle
                v-model="form.usePathStyleEndpoint"
                label="Use path-style endpoint"
                :disable="store.isLoading || store.isSaving"
              />
            </template>
          </template>

          <div v-else class="text-body2 text-grey-7">
            Files are stored on the local public disk (storage/app/public).
          </div>

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
              label="Test connection"
              :loading="store.isTesting"
              :disable="store.isLoading || store.isSaving"
              @click="testConnection"
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
import {
  useFileStorageStore,
  type FileStoragePayload,
  type StorageDriver,
} from 'src/stores/file-storage-store';

const $q = useQuasar();
const store = useFileStorageStore();
const { settings } = storeToRefs(store);

const driverOptions = [
  { label: 'Local disk', value: 'local' as StorageDriver },
  { label: 'Azure Blob Storage', value: 'azure' as StorageDriver },
  { label: 'Amazon S3 / compatible', value: 's3' as StorageDriver },
];

const form = reactive({
  driver: 'local' as StorageDriver,
  container: 'uploads',
  accountName: '',
  accountKey: '',
  endpoint: '',
  region: 'us-east-1',
  usePathStyleEndpoint: false,
  prefix: '',
});

const containerLabel = computed(() => (form.driver === 's3' ? 'Bucket' : 'Container'));
const accountNameLabel = computed(() =>
  form.driver === 's3' ? 'Access key' : 'Storage account name',
);
const accountKeyLabel = computed(() =>
  form.driver === 's3' ? 'Secret access key' : 'Account key',
);

function syncFormFromStore() {
  if (!settings.value) {
    return;
  }

  form.driver = settings.value.driver;
  form.container = settings.value.container || 'uploads';
  form.accountName = settings.value.accountName ?? '';
  form.accountKey = '';
  form.endpoint = settings.value.endpoint ?? '';
  form.region = settings.value.region || 'us-east-1';
  form.usePathStyleEndpoint = settings.value.usePathStyleEndpoint;
  form.prefix = settings.value.prefix ?? '';
}

function resetForm() {
  syncFormFromStore();
}

function buildPayload(): FileStoragePayload {
  const payload: FileStoragePayload = {
    driver: form.driver,
    container: form.container.trim() || 'uploads',
    accountName: form.accountName.trim() || null,
    endpoint: form.endpoint.trim() || null,
    region: form.region.trim() || null,
    usePathStyleEndpoint: form.usePathStyleEndpoint,
    prefix: form.prefix.trim() || null,
  };

  if (form.accountKey.trim()) {
    payload.accountKey = form.accountKey.trim();
  }

  return payload;
}

async function save() {
  try {
    await store.updateSettings(buildPayload());
    form.accountKey = '';
    $q.notify({
      type: 'positive',
      message: 'File storage settings saved.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save file storage settings.',
    });
  }
}

async function testConnection() {
  const result = await store.testConnection(buildPayload());
  $q.notify({
    type: result.ok ? 'positive' : 'negative',
    message: result.message,
  });
}

watch(settings, syncFormFromStore, { immediate: true });

onMounted(async () => {
  const loaded = await store.fetchSettings();
  if (!loaded && store.error) {
    $q.notify({
      type: 'negative',
      message: store.error,
    });
  }
});
</script>

<style scoped>
.file-storage-card {
  max-width: 720px;
}
</style>
