<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Work Site</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <WorksiteForm
        v-model="form"
        :localities="store.localityOptions"
        :locality-loading="store.isLoadingLocalities"
        :saving="saving"
        submit-label="Save Changes"
        @submit="save"
        @cancel="closeDialog"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useWorksiteStore, type Worksite, type WorksitePayload } from 'src/stores/worksite-store';
import WorksiteForm from './WorksiteForm.vue';

const $q = useQuasar();
const store = useWorksiteStore();
const saving = ref(false);
const editingId = ref<number | null>(null);
const form = ref<WorksitePayload>(emptyForm());

const isOpen = computed({
  get: () => !!store.worksiteToEdit,
  set: (value) => {
    if (!value) {
      store.setWorksiteToEdit(null);
    }
  },
});

watch(
  () => store.worksiteToEdit,
  async (worksite) => {
    if (!worksite) {
      form.value = emptyForm();
      editingId.value = null;
      return;
    }

    editingId.value = worksite.id;
    form.value = worksiteToForm(worksite);

    if (!store.localityOptions.length) {
      await store.fetchLocalityOptions();
    }
  },
  { immediate: true },
);

function emptyForm(): WorksitePayload {
  return {
    name: '',
    address1: '',
    address2: null,
    localityId: '',
  };
}

function worksiteToForm(worksite: Worksite): WorksitePayload {
  return {
    name: worksite.name,
    address1: worksite.address1,
    address2: worksite.address2 ?? null,
    localityId: worksite.localityId,
  };
}

function closeDialog() {
  store.setWorksiteToEdit(null);
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

  if (!editingId.value) {
    return;
  }

  saving.value = true;

  try {
    await store.updateWorksite(editingId.value, {
      name: form.value.name.trim(),
      address1: form.value.address1.trim(),
      address2: form.value.address2?.trim() || null,
      localityId: form.value.localityId,
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Work site updated.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update work site.',
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
