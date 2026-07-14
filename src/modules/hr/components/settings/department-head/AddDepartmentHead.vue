<template>
  <q-dialog v-model="isOpen" position="right">
    <q-card class="q-drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Appoint Department Head</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="closeDialog" />
      </q-card-section>

      <q-card-section class="q-pt-sm">
        <q-form class="q-gutter-md" @submit.prevent="save">
          <DepartmentSelect
            v-model="form.departmentId"
            label="Department *"
          />
          <EmployeeSelect
            v-model="form.employeeId"
            label="Employee *"
          />
          <SsBenefitDateField
            v-model="form.startDate"
            label="Start date *"
            required
            :disable="saving"
          />
          <q-input
            v-model="form.notes"
            type="textarea"
            label="Notes"
            outlined
            dense
            autogrow
          />

          <q-card-actions align="right" class="q-pt-md">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="closeDialog" />
            <q-btn type="submit" color="primary" :loading="saving" label="Appoint" />
          </q-card-actions>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';
import SsBenefitDateField from '@payroll/components/employee/ss-benefit/SsBenefitDateField.vue';
import { useDepartmentHeadStore } from 'src/stores/department-head-store';

const $q = useQuasar();
const store = useDepartmentHeadStore();
const saving = ref(false);

const form = reactive({
  departmentId: null as number | null,
  employeeId: null as string | null,
  startDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value) => {
    store.isCreateOpen = value;
  },
});

function resetForm() {
  form.departmentId = null;
  form.employeeId = null;
  form.startDate = new Date().toISOString().slice(0, 10);
  form.notes = '';
}

function closeDialog() {
  resetForm();
  store.closeCreateDialog();
}

async function save() {
  if (!form.departmentId || !form.employeeId || !form.startDate) {
    $q.notify({ color: 'negative', position: 'top', message: 'Department, employee, and start date are required.' });
    return;
  }

  saving.value = true;

  try {
    await store.createAssignment({
      departmentId: form.departmentId,
      employeeId: form.employeeId,
      startDate: form.startDate,
      notes: form.notes.trim() || null,
    });
    $q.notify({ color: 'positive', position: 'top', message: 'Department head appointed.' });
    closeDialog();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Failed to appoint department head.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.q-drawer-card {
  width: 34vw;
  max-width: 460px;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.q-drawer-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
