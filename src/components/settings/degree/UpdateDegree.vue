<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ 'Edit Degree' }}</div>
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
import { useDegreeStore } from '../../../stores/degree-store';
import type { Degree } from '../../../components/models';

const store = useDegreeStore();
const $q = useQuasar();

const saving = ref(false);

// reactive editing object based on store.degreeToEdit
const editing = ref<Partial<Degree>>({});
watch(
  () => store.degreeToEdit,
  (newVal) => {
    editing.value = newVal ? { ...newVal } : {};
  },
  { immediate: true },
);

// dialog opens when store.institution is set
const isOpen = computed({
  get: () => !!store.degreeToEdit,
  set: (val: boolean) => {
    if (!val) store.setDegreeToEdit(null); // closing dialog clears store
  },
});

function closeDialog() {
  store.setDegreeToEdit(null);
}

async function save() {
  if (!editing.value.name) {
    return $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Name is required.',
    });
  }

  saving.value = true;

  try {
    if (editing.value.id) {
      const payload = editing.value;
      await store.updateDegree(editing.value.id, payload);
      await store.fetchDegrees(store.currentPage, store.total);
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Degree updated!',
      });
    } else {
      $q.notify({
        color: 'warning',
        position: 'top',
        icon: 'info',
        message: 'Select a Degree to edit.',
      });
    }
  } finally {
    saving.value = false;
    closeDialog();
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
