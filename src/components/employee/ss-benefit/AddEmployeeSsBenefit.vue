<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add SS Benefit</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section>
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
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeSsBenefitStore } from 'src/stores/employee-ss-benefit-store';
import SsBenefitTypeSelect from 'src/components/ss-benefit-type/SsBenefitTypeSelect.vue';
import SsBenefitDateField from './SsBenefitDateField.vue';

const props = defineProps<{ employeeId: string }>();
const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeSsBenefitStore();
const saving = ref(false);

const form = reactive({
  is_receiving_benefit: true,
  ss_benefit_type_id: null as number | null,
  effective_from: new Date().toISOString().slice(0, 10),
  effective_to: null as string | null,
  verified_at: null as string | null,
  notes: '',
});

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (v) => { store.isCreateOpen = v; },
});

function closeDialog() {
  store.closeCreateDialog();
}

async function save() {
  if (!form.effective_from) {
    $q.notify({ color: 'negative', position: 'top', message: 'Effective from is required.' });
    return;
  }
  saving.value = true;
  try {
    await store.createRecord({
      employeeId: props.employeeId,
      is_receiving_benefit: form.is_receiving_benefit,
      ss_benefit_type_id: form.ss_benefit_type_id,
      effective_from: form.effective_from,
      effective_to: form.effective_to || null,
      verified_at: form.verified_at || null,
      notes: form.notes || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Benefit status saved.' });
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
