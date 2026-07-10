<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Payroll Earning Code</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section v-if="form" class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input v-model="form.code" label="Code *" dense outlined :disable="saving" />
          <q-input v-model="form.name" label="Name *" dense outlined :disable="saving" />
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
          <q-toggle v-model="form.is_taxable" label="Taxable" :disable="saving" />
          <q-toggle v-model="form.is_ss_subject" label="Social Security Subject" :disable="saving" />
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
import { usePayrollEarningCodeStore } from 'src/stores/payroll-earning-code-store';
import AccountSelect from 'src/components/employee/common/AccountSelect.vue';

const $q = useQuasar();
const store = usePayrollEarningCodeStore();
const saving = ref(false);

const form = ref<{
  id: number;
  code: string;
  name: string;
  account_id: string | null;
  sort_order: number;
  is_taxable: boolean;
  is_ss_subject: boolean;
  is_active: boolean;
} | null>(null);

const isOpen = computed({
  get: () => !!store.codeToEdit,
  set: (value) => {
    if (!value) store.setCodeToEdit(null);
  },
});

watch(
  () => store.codeToEdit,
  (code) => {
    if (!code) {
      form.value = null;
      return;
    }
    form.value = {
      id: code.id,
      code: code.code,
      name: code.name,
      account_id: code.account_id ?? null,
      sort_order: code.sort_order,
      is_taxable: code.is_taxable,
      is_ss_subject: code.is_ss_subject,
      is_active: code.is_active,
    };
  },
  { immediate: true },
);

function closeDialog() {
  store.setCodeToEdit(null);
}

async function save() {
  if (!form.value?.code.trim() || !form.value.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', icon: 'warning', message: 'Code and name are required.' });
    return;
  }

  saving.value = true;
  try {
    await store.updateEarningCode(form.value.id, {
      code: form.value.code.trim().toUpperCase(),
      name: form.value.name.trim(),
      account_id: form.value.account_id,
      sort_order: form.value.sort_order,
      is_taxable: form.value.is_taxable,
      is_ss_subject: form.value.is_ss_subject,
      is_active: form.value.is_active,
    });
    $q.notify({ color: 'positive', position: 'top', icon: 'check_circle', message: 'Earning code updated.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to update earning code.',
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
