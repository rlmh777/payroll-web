<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">Add Work Site</div>
      </AppDialogHeader>

      <AppDialogBody>
        <WorksiteForm
          v-model="form"
          :localities="store.localityOptions"
          :locality-loading="store.isLoadingLocalities"
          :saving="saving"
          submit-label="Save"
          @submit="onSubmit"
          @cancel="onClose"
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
import WorksiteForm from '@hr/components/settings/worksite/WorksiteForm.vue';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [worksiteId: number];
}>();

const $q = useQuasar();
const store = useWorksiteStore();
const saving = ref(false);
const form = ref<WorksitePayload>(emptyForm());

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

function emptyForm(): WorksitePayload {
  return {
    name: '',
    address1: '',
    address2: null,
    localityId: '',
  };
}

async function onSubmit() {
  if (!form.value.name.trim() || !form.value.address1.trim() || !form.value.localityId) {
    $q.notify({ color: 'negative', position: 'top', message: 'Name, address, and locality are required.' });
    return;
  }

  saving.value = true;
  try {
    const created = await store.createWorksite({
      name: form.value.name.trim(),
      address1: form.value.address1.trim(),
      address2: form.value.address2?.trim() || null,
      localityId: form.value.localityId,
    });

    if (created) {
      $q.notify({ color: 'positive', position: 'top', message: 'Work site created.' });
      emit('saved', created.id);
      onClose();
    }
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to create work site.',
    });
  } finally {
    saving.value = false;
  }
}

function onClose() {
  form.value = emptyForm();
  isOpen.value = false;
}

watch(isOpen, async (open) => {
  if (open) {
    form.value = emptyForm();
    if (!store.localityOptions.length) {
      await store.fetchLocalityOptions();
    }
  }
});
</script>
