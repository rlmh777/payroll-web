<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Bank Account Type</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
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
            <q-btn :loading="saving" color="primary" label="Save Changes" type="submit" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useBankAccountTypeStore,
  type BankAccountType,
} from 'src/stores/bank-account-type-store';

const store = useBankAccountTypeStore();
const $q = useQuasar();
const saving = ref(false);
const editing = ref<Partial<BankAccountType>>({});

watch(
  () => store.bankAccountTypeToEdit,
  (value) => {
    editing.value = value ? { ...value } : {};
  },
  { immediate: true },
);

const isOpen = computed({
  get: () => !!store.bankAccountTypeToEdit,
  set: (value) => {
    if (!value) {
      store.setBankAccountTypeToEdit(null);
    }
  },
});

function closeDialog() {
  store.setBankAccountTypeToEdit(null);
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
    return;
  }

  saving.value = true;

  try {
    await store.updateBankAccountType(editing.value.id, {
      name: editing.value.name.trim(),
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Bank account type updated.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update bank account type.',
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
