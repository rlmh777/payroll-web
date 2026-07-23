<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Account Mapping</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section v-if="form" class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input v-model="form.code" label="Code *" dense outlined :disable="saving" />
          <q-input v-model="form.name" label="Payment type name *" dense outlined :disable="saving" />
          <q-input
            v-model="form.description"
            label="Description"
            type="textarea"
            autogrow
            dense
            outlined
            :disable="saving"
          />
          <AccountSelect
            v-model="form.account_id"
            label="GL Account"
            clearable
            :disable="saving"
          />
          <q-input
            v-model.number="form.sort_order"
            type="number"
            label="Sort Order"
            dense
            outlined
            :disable="saving"
          />
          <q-toggle v-model="form.is_active" label="Active" :disable="saving" />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePayrollAccountMappingStore } from 'src/stores/payroll-account-mapping-store';
import AccountSelect from '@hr/components/employee/common/AccountSelect.vue';

const $q = useQuasar();
const store = usePayrollAccountMappingStore();
const saving = ref(false);

const form = ref<{
  id: string;
  code: string;
  name: string;
  description: string;
  account_id: string | null;
  sort_order: number;
  is_active: boolean;
} | null>(null);

const isOpen = computed({
  get: () => !!store.mappingToEdit,
  set: (value) => {
    if (!value) store.setMappingToEdit(null);
  },
});

watch(
  () => store.mappingToEdit,
  (mapping) => {
    if (!mapping) {
      form.value = null;
      return;
    }
    form.value = {
      id: mapping.id,
      code: mapping.code,
      name: mapping.name,
      description: mapping.description ?? '',
      account_id: mapping.account_id ?? null,
      sort_order: mapping.sort_order,
      is_active: mapping.is_active,
    };
  },
  { immediate: true },
);

function closeDialog() {
  store.setMappingToEdit(null);
}

async function save() {
  if (!form.value?.code.trim() || !form.value.name.trim()) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'warning',
      message: 'Code and name are required.',
    });
    return;
  }

  saving.value = true;
  try {
    await store.updateMapping(form.value.id, {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      description: form.value.description.trim() || null,
      account_id: form.value.account_id,
      sort_order: form.value.sort_order,
      is_active: form.value.is_active,
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Account mapping updated.',
    });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update account mapping.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: 30vw;
  max-width: 420px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
