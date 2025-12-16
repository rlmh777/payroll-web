<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">New Degree</div>
        <q-space />
        <q-btn
          icon="close"
          flat
          round
          dense
          :disable="saving"
          @click="
            () => {
              name = '';
              store.closeCreateDailog();
            }
          "
        />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form @submit.prevent="save" class="q-gutter-md">
          <q-input
            v-model="name"
            label="Degree Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            :disable="saving"
          />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              :disable="saving"
              @click="
                () => {
                  name = '';
                  store.closeCreateDailog();
                }
              "
            />
            <q-btn type="submit" color="primary" :loading="saving" label="Create" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useDegreeStore } from '../../../stores/degree-store';

const $q = useQuasar();
const store = useDegreeStore();

const name = ref('');
const saving = ref(false);

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (v) => (store.isCreateOpen = v),
});

async function save() {
  if (!name.value.trim()) {
    return $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Name is required.',
    });
  }

  saving.value = true;

  try {
    await store.createDegree(name.value.trim());
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Degree created!',
    });

    await store.fetchDegrees(store.currentPage, store.total);

    // Reset directly after save
    name.value = '';
    store.closeCreateDailog();
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
