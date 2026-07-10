<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Work Site</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section v-if="form">
        <WorksiteForm
          v-model="form"
          :localities="store.localityOptions"
          :locality-loading="store.isLoadingLocalities"
          :saving="saving"
          submit-label="Save Changes"
          @submit="onSubmit"
          @cancel="onClose"
        />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useWorksiteStore, type Worksite, type WorksitePayload } from 'src/stores/worksite-store';
import WorksiteForm from 'src/components/settings/worksite/WorksiteForm.vue';

const props = defineProps<{
  modelValue: boolean;
  worksite: Worksite | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [];
}>();

const $q = useQuasar();
const store = useWorksiteStore();
const saving = ref(false);
const form = ref<WorksitePayload | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(() => props.worksite, async (worksite) => {
  if (!worksite) {
    form.value = null;
    return;
  }

  form.value = {
    name: worksite.name,
    address1: worksite.address1,
    address2: worksite.address2 ?? null,
    localityId: worksite.localityId,
  };

  if (!store.localityOptions.length) {
    await store.fetchLocalityOptions();
  }
}, { immediate: true });

async function onSubmit() {
  if (!form.value || !props.worksite) return;

  if (!form.value.name.trim() || !form.value.address1.trim() || !form.value.localityId) {
    $q.notify({ color: 'negative', position: 'top', message: 'Name, address, and locality are required.' });
    return;
  }

  saving.value = true;
  try {
    await store.updateWorksite(props.worksite.id, {
      name: form.value.name.trim(),
      address1: form.value.address1.trim(),
      address2: form.value.address2?.trim() || null,
      localityId: form.value.localityId,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Work site updated.' });
    emit('updated');
    onClose();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to update work site.',
    });
  } finally {
    saving.value = false;
  }
}

function onClose() {
  isOpen.value = false;
}
</script>

<style scoped>
.drawer-card {
  width: min(480px, 95vw);
  height: 100vh;
}
</style>
