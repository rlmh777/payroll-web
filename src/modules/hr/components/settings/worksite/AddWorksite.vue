<template>
  <q-dialog v-model="isOpen" position="right">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">New Work Site</div>
        <template #close>
          <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <WorksiteForm
          v-model="form"
          :localities="store.localityOptions"
          :locality-loading="store.isLoadingLocalities"
          :saving="saving"
          submit-label="Create"
          @submit="save"
          @cancel="closeDialog"
        />
      </AppDialogBody>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
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
