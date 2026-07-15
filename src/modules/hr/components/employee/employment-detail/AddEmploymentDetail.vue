<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="employment-contract-drawer">
      <q-card-section class="employment-contract-drawer__header row items-center no-wrap q-pa-none">
        <div class="text-h6">Add Employment Contract</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>
      <q-card-section class="employment-contract-drawer__body q-pa-none">
        <q-form @submit.prevent="save">
          <EmploymentDetailForm v-model="form" :disable="saving" />
          <div class="employment-contract-drawer__actions row justify-end q-gutter-sm">
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
import { useEmploymentDetailStore } from 'src/stores/employment-detail-store';
import EmploymentDetailForm from './EmploymentDetailForm.vue';
import {
  createDefaultEmploymentDetailForm,
  validateEmploymentDetailForm,
  type EmploymentDetailFormModel,
} from './employment-detail-form';

const props = defineProps<{ employeeId: string }>();
const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmploymentDetailStore();
const saving = ref(false);
const form = reactive<EmploymentDetailFormModel>(createDefaultEmploymentDetailForm());

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (v) => { store.isCreateOpen = v; },
});

function closeDialog() {
  store.closeCreateDialog();
  Object.assign(form, createDefaultEmploymentDetailForm());
}

function validateForm(): string | null {
  return validateEmploymentDetailForm(form);
}

async function save() {
  const validationError = validateForm();
  if (validationError) {
    $q.notify({ color: 'negative', position: 'top', message: validationError });
    return;
  }

  saving.value = true;
  try {
    await store.createRecord({
      employeeId: props.employeeId,
      startDate: form.startDate,
      endDate: form.endDate || null,
      isActive: form.isActive,
      jobTitleId: form.jobTitleId,
      requiresClocking: form.requiresClocking,
      benefits: form.benefits?.trim() || null,
      accountId: form.accountId,
      contractTypeId: form.contractTypeId,
      employmentPolicies: form.employmentPolicies.trim() || null,
      departmentId: form.departmentId,
      worksiteId: form.worksiteId,
      defaultPayPeriodGroupId: form.defaultPayPeriodGroupId as string,
    }, form.contractAgreementFile);
    $q.notify({ color: 'positive', position: 'top', message: 'Employment contract saved.' });
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
.employment-contract-drawer {
  width: 40vw;
  max-width: 560px;
  height: 100vh;
  overflow-y: auto;
}

.employment-contract-drawer__header,
.employment-contract-drawer__body {
  padding-left: 24px;
  padding-right: 24px;
}

.employment-contract-drawer__header {
  padding-top: 24px;
  padding-bottom: 16px;
}

.employment-contract-drawer__body {
  padding-top: 0;
  padding-bottom: 24px;
}

.employment-contract-drawer__actions {
  margin-top: 20px;
}
</style>
