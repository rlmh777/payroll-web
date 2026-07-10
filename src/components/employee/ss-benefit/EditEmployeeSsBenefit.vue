<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit SS Benefit Status</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section v-if="form">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-toggle v-model="form.is_receiving_benefit" label="Receiving SS benefit" :disable="saving" />
          <SsBenefitTypeSelect v-model="form.ss_benefit_type_id" :disable="saving" />

          <SsBenefitDateField
            v-model="form.effective_from"
            label="Effective from *"
            required
            :disable="saving"
          />
          <SsBenefitDateField
            v-model="form.effective_to"
            label="Effective to"
            clearable
            :disable="saving"
          />
          <SsBenefitDateField
            v-model="form.verified_at"
            label="Verified at"
            clearable
            :disable="saving"
          />

          <q-input v-model="form.notes" type="textarea" label="Notes" dense outlined :disable="saving" />
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
import { useEmployeeSsBenefitStore } from 'src/stores/employee-ss-benefit-store';
import SsBenefitTypeSelect from 'src/components/ss-benefit-type/SsBenefitTypeSelect.vue';
import SsBenefitDateField from './SsBenefitDateField.vue';

const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeSsBenefitStore();
const saving = ref(false);

const form = ref<{
  id: string;
  is_receiving_benefit: boolean;
  ss_benefit_type_id: number | null;
  effective_from: string;
  effective_to: string | null;
  verified_at: string | null;
  notes: string;
} | null>(null);

const isOpen = computed({
  get: () => !!store.recordToEdit,
  set: (v) => { if (!v) store.setRecordToEdit(null); },
});

watch(() => store.recordToEdit, (record) => {
  if (!record) {
    form.value = null;
    return;
  }
  form.value = {
    id: record.id,
    is_receiving_benefit: record.is_receiving_benefit,
    ss_benefit_type_id: record.ss_benefit_type_id ?? record.benefit_type?.id ?? null,
    effective_from: record.effective_from?.slice(0, 10) ?? '',
    effective_to: record.effective_to?.slice(0, 10) ?? null,
    verified_at: record.verified_at?.slice(0, 10) ?? null,
    notes: record.notes ?? '',
  };
}, { immediate: true });

function closeDialog() {
  store.setRecordToEdit(null);
}

async function save() {
  if (!form.value) return;
  saving.value = true;
  try {
    await store.updateRecord(form.value.id, {
      is_receiving_benefit: form.value.is_receiving_benefit,
      ss_benefit_type_id: form.value.ss_benefit_type_id,
      effective_from: form.value.effective_from,
      effective_to: form.value.effective_to || null,
      verified_at: form.value.verified_at || null,
      notes: form.value.notes || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Benefit status updated.' });
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
