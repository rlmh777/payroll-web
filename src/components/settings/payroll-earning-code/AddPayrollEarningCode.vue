<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">New Payroll Earning Code</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="form.code"
            label="Code *"
            dense
            outlined
            :rules="[(val) => !!val || 'Code is required']"
            :disable="saving"
          />
          <q-input
            v-model="form.name"
            label="Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
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
          <q-toggle v-model="form.is_taxable" label="Taxable" :disable="saving" />
          <q-toggle v-model="form.is_ss_subject" label="Social Security Subject" :disable="saving" />
          <q-toggle v-model="form.is_active" label="Active" :disable="saving" />

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
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { usePayrollEarningCodeStore } from 'src/stores/payroll-earning-code-store';
import AccountSelect from 'src/components/employee/common/AccountSelect.vue';

const $q = useQuasar();
const store = usePayrollEarningCodeStore();
const saving = ref(false);

const form = reactive({
  code: '',
  name: '',
  account_id: null as string | null,
  sort_order: 0,
  is_taxable: true,
  is_ss_subject: true,
  is_active: true,
});

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value) => {
    store.isCreateOpen = value;
  },
});

function resetForm() {
  form.code = '';
  form.name = '';
  form.account_id = null;
  form.sort_order = 0;
  form.is_taxable = true;
  form.is_ss_subject = true;
  form.is_active = true;
}

function closeDialog() {
  resetForm();
  store.closeCreateDialog();
}

async function save() {
  if (!form.code.trim() || !form.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', icon: 'warning', message: 'Code and name are required.' });
    return;
  }

  saving.value = true;
  try {
    await store.createEarningCode({
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      account_id: form.account_id,
      sort_order: form.sort_order,
      is_taxable: form.is_taxable,
      is_ss_subject: form.is_ss_subject,
      is_active: form.is_active,
    });
    $q.notify({ color: 'positive', position: 'top', icon: 'check_circle', message: 'Earning code created.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: error instanceof Error ? error.message : 'Failed to create earning code.',
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
