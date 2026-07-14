<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add bank account</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section>
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
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeBankStore } from '@payroll/stores/employee-bank-store';
import BankSelect from '@payroll/components/shared/bank/BankSelect.vue';

const props = defineProps<{ employeeId: string }>();
const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeBankStore();
const saving = ref(false);

const form = reactive({
  bankId: null as string | null,
  accountNumber: '',
  isPrimary: true,
  notes: '',
});

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value) => {
    store.isCreateOpen = value;
  },
});

function resetForm() {
  form.bankId = null;
  form.accountNumber = '';
  form.isPrimary = store.records.length === 0;
  form.notes = '';
}

function closeDialog() {
  store.closeCreateDialog();
  resetForm();
}

async function save() {
  if (!form.bankId || !form.accountNumber.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Bank and account number are required.' });
    return;
  }

  saving.value = true;
  try {
    await store.createRecord({
      employeeId: props.employeeId,
      bankId: form.bankId,
      accountNumber: form.accountNumber.trim(),
      isPrimary: form.isPrimary,
      notes: form.notes.trim() || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Bank account saved.' });
    emit('saved');
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
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
