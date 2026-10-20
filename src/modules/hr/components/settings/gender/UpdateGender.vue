<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Gender</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="save" class="q-gutter-md">
          <q-input
            v-model="editing.name"
            label="Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            :disable="saving"
          />
          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save Changes" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useGenderStore, type Gender } from '@core/stores/gender-store';

const store = useGenderStore();
const $q = useQuasar();
const saving = ref(false);
const editing = ref<Partial<Gender>>({});

watch(
  () => store.genderToEdit,
  (value) => {
    editing.value = value ? { ...value } : {};
  },
  { immediate: true },
);

const isOpen = computed({
  get: () => !!store.genderToEdit,
  set: (value: boolean) => {
    if (!value) {
      store.setGenderToEdit(null);
    }
  },
});

function closeDialog() {
  store.setGenderToEdit(null);
}

async function save() {
  if (!editing.value.name?.trim()) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Name is required.',
    });
    return;
  }

  if (!editing.value.id) {
    $q.notify({
      color: 'warning',
      position: 'top',
      icon: 'info',
      message: 'Select a gender to edit.',
    });
    return;
  }

  saving.value = true;
  try {
    await store.updateGender(editing.value.id, { name: editing.value.name.trim() });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Gender updated.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update gender.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: 30vw;
  max-width: 400px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
