<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">New Bank Account Type</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="name"
            label="Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            :disable="saving"
          />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Create" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useBankAccountTypeStore } from 'src/stores/bank-account-type-store';

const $q = useQuasar();
const store = useBankAccountTypeStore();
const name = ref('');
const saving = ref(false);

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value) => {
    store.isCreateOpen = value;
  },
});

function closeDialog() {
  name.value = '';
  store.closeCreateDialog();
}

async function save() {
  if (!name.value.trim()) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Name is required.',
    });
    return;
  }

  saving.value = true;

  try {
    await store.createBankAccountType(name.value.trim());
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Bank account type created.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to create bank account type.',
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
