<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="compensation-drawer">
      <q-card-section class="compensation-drawer__header row items-center no-wrap q-pa-none">
        <div class="text-h6">Edit Compensation</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section class="compensation-drawer__body q-pa-none">
        <q-banner
          v-if="store.recordToEdit?.isActive"
          dense
          rounded
          class="bg-blue-1 text-primary q-mb-md"
        >
          Saving updates this compensation record and refreshes affected timesheets.
        </q-banner>
        <q-form @submit.prevent="save">
          <EmployeeCompensationForm
            v-model="form"
            :disable="saving"
            :employment-details="employmentDetails"
            :payrate-frequency-name="payrateFrequencyName"
          />
          <div class="compensation-drawer__actions row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useEmployeeCompensationStore } from 'src/stores/employee-compensation-store';
import EmployeeCompensationForm from './EmployeeCompensationForm.vue';
import {
  createDefaultEmployeeCompensationForm,
  mapEmployeeCompensationRecordToForm,
  validateEmployeeCompensationForm,
  type EmployeeCompensationFormModel,
} from './compensation-form';
import type { EmploymentDetail } from 'src/stores/employment-detail-store';

withDefaults(defineProps<{
  employmentDetails: EmploymentDetail[];
  payrateFrequencyName: string | null;
}>(), {
  payrateFrequencyName: null,
});
const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeCompensationStore();
const saving = ref(false);
const form = reactive<EmployeeCompensationFormModel>(createDefaultEmployeeCompensationForm());

const isOpen = computed({
  get: () => !!store.recordToEdit,
  set: (v) => { if (!v) store.setRecordToEdit(null); },
});

watch(() => store.recordToEdit, (record) => {
  if (!record) {
    Object.assign(form, createDefaultEmployeeCompensationForm());
    return;
  }

  Object.assign(form, mapEmployeeCompensationRecordToForm(record));
}, { immediate: true });

function closeDialog() {
  store.setRecordToEdit(null);
  Object.assign(form, createDefaultEmployeeCompensationForm());
}

async function save() {
  if (!store.recordToEdit) return;

  const validationError = validateEmployeeCompensationForm(form);
  if (validationError) {
    $q.notify({ color: 'negative', position: 'top', message: validationError });
    return;
  }

  saving.value = true;
  try {
    await store.updateRecord(store.recordToEdit.id, {
      employmentDetailId: form.employmentDetailId,
      effectiveDate: form.effectiveDate,
      endDate: form.endDate || null,
      isActive: form.isActive,
      compensationMethod: form.compensationMethod,
      requiresClocking: form.requiresClocking,
      hourlyRate: Number(form.hourlyRate),
      yearlyRate: Number(form.yearlyRate),
      standardWeeklyHours: Number(form.standardWeeklyHours),
      payscale: form.payscale.trim() || null,
      payscalePoint: form.payscalePoint.trim() || null,
      reasonType: form.reasonType,
      reasonNote: form.reasonNote.trim() || null,
    });
    $q.notify({
      color: 'positive',
      position: 'top',
      message: 'Compensation record updated.',
    });
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
.compensation-drawer {
  width: 40vw;
  max-width: 560px;
  height: 100vh;
  overflow-y: auto;
}

.compensation-drawer__header,
.compensation-drawer__body {
  padding-left: 24px;
  padding-right: 24px;
}

.compensation-drawer__header {
  padding-top: 24px;
  padding-bottom: 16px;
}

.compensation-drawer__body {
  padding-top: 0;
  padding-bottom: 24px;
}

.compensation-drawer__actions {
  margin-top: 20px;
}
</style>
