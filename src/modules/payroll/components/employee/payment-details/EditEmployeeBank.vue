<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit bank account</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section v-if="form">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <BankSelect
            v-model="form.bankId"
            label="Bank *"
            :rules="[(val: string | null | undefined) => !!val || 'Bank is required']"
            :disable="saving"
            :show-add-new="true"
            :show-edit="true"
          />

          <q-input
            v-model="form.accountNumber"
            label="Account number *"
            dense
            outlined
            maxlength="255"
            counter
            :rules="[(val: string | null | undefined) => !!val || 'Account number is required']"
            :disable="saving"
          />

          <q-toggle
            v-model="form.isPrimary"
            label="Primary account for payroll"
            :disable="saving"
          />

          <q-input
            v-model="form.notes"
            type="textarea"
            label="Notes"
            dense
            outlined
            :disable="saving"
          />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeBankStore } from '@payroll/stores/employee-bank-store';
import BankSelect from '@payroll/components/shared/bank/BankSelect.vue';

const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeBankStore();
const saving = ref(false);

const form = ref<{
  id: string;
  bankId: string | null;
  accountNumber: string;
  isPrimary: boolean;
  notes: string;
} | null>(null);

const isOpen = computed({
  get: () => !!store.recordToEdit,
  set: (value) => {
    if (!value) {
      store.setRecordToEdit(null);
    }
  },
});

watch(() => store.recordToEdit, (record) => {
  if (!record) {
    form.value = null;
    return;
  }

  form.value = {
    id: record.id,
    bankId: record.bankId,
    accountNumber: record.accountNumber,
    isPrimary: record.isPrimary,
    notes: record.notes ?? '',
  };
}, { immediate: true });

function closeDialog() {
  store.setRecordToEdit(null);
}

async function save() {
  if (!form.value?.bankId || !form.value.accountNumber.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Bank and account number are required.' });
    return;
  }

  saving.value = true;
  try {
    await store.updateRecord(form.value.id, {
      bankId: form.value.bankId,
      accountNumber: form.value.accountNumber.trim(),
      isPrimary: form.value.isPrimary,
      notes: form.value.notes.trim() || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Bank account updated.' });
    emit('saved');
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Update failed.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 420px;
  height: 100vh;
}
</style>
