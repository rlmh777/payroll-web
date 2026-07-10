<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Relationship</div>
        <q-space />
        <q-btn icon="close" flat round dense @click="closeDialog" :disable="saving" />
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
            <q-btn flat label="Cancel" color="grey" @click="closeDialog" :disable="saving" />
            <q-btn :loading="saving" color="primary" label="Save Changes" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRelationshipStore, type Relationship } from '../../../stores/relationship-store';

const store = useRelationshipStore();
const $q = useQuasar();

const saving = ref(false);
const editing = ref<Partial<Relationship>>({});

watch(
  () => store.relationshipToEdit,
  (newVal) => {
    editing.value = newVal ? { ...newVal } : {};
  },
  { immediate: true },
);

const isOpen = computed({
  get: () => !!store.relationshipToEdit,
  set: (val: boolean) => {
    if (!val) store.setRelationshipToEdit(null);
  },
});

function closeDialog() {
  store.setRelationshipToEdit(null);
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
      message: 'Select a relationship to edit.',
    });
    return;
  }

  saving.value = true;

  try {
    await store.updateRelationship(editing.value.id, {
      name: editing.value.name.trim(),
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Relationship updated!',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update relationship.',
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
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
