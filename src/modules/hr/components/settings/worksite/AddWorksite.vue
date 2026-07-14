<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">New Work Site</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <WorksiteForm
        v-model="form"
        :localities="store.localityOptions"
        :locality-loading="store.isLoadingLocalities"
        :saving="saving"
        submit-label="Create"
        @submit="save"
        @cancel="closeDialog"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useWorksiteStore, type WorksitePayload } from 'src/stores/worksite-store';
import WorksiteForm from './WorksiteForm.vue';

const $q = useQuasar();
const store = useWorksiteStore();
const saving = ref(false);

const form = ref<WorksitePayload>(emptyForm());

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value) => {
    store.isCreateOpen = value;
  },
});

watch(
  () => store.isCreateOpen,
  async (open) => {
    if (open) {
      form.value = emptyForm();
      if (!store.localityOptions.length) {
        await store.fetchLocalityOptions();
      }
    }
  },
);

function emptyForm(): WorksitePayload {
  return {
    name: '',
    address1: '',
    address2: null,
    localityId: '',
  };
}

function closeDialog() {
  form.value = emptyForm();
  store.closeCreateDialog();
}

async function save() {
  if (!form.value.name.trim() || !form.value.address1.trim() || !form.value.localityId) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Name, address, and locality are required.',
    });
    return;
  }

  saving.value = true;

  try {
    await store.createWorksite({
      name: form.value.name.trim(),
      address1: form.value.address1.trim(),
      address2: form.value.address2?.trim() || null,
      localityId: form.value.localityId,
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Work site created.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to create work site.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: min(480px, 95vw);
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
