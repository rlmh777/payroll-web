<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false">
    <q-card class="department-dialog">
      <q-card-section class="row items-center no-wrap dialog-header">
        <div class="dialog-title">Edit Department</div>
        <q-space />
        <q-btn flat round icon="close" size="lg" class="dialog-close" :disable="store.isSaving" @click="closeDialog" />
      </q-card-section>

      <DepartmentForm
        v-model="form"
        :exclude-department-id="store.departmentToEdit?.id ?? null"
        :saving="store.isSaving"
        submit-label="Save"
        @submit="saveDepartment"
        @cancel="closeDialog"
      />
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useDepartmentStore, type Department, type DepartmentPayload } from 'src/stores/department-store';
import DepartmentForm from './DepartmentForm.vue';

const store = useDepartmentStore();
const $q = useQuasar();
const form = ref<DepartmentPayload>(emptyForm());

const isOpen = computed({
  get: () => !!store.departmentToEdit,
  set: (value: boolean) => {
    if (!value) {
      closeDialog();
    }
  },
});

function emptyForm(): DepartmentPayload {
  return {
    name: '',
    parentId: null,
    work_timesheet_id: null,
  };
}

function departmentToForm(department: Department): DepartmentPayload {
  return {
    name: department.name,
    parentId: department.parentId ?? null,
    work_timesheet_id:
      department.current_work_timesheet_assignment?.work_timesheet_id ??
      department.current_work_timesheet_assignment?.work_timesheet?.id ??
      null,
  };
}

function closeDialog() {
  store.setDepartmentToEdit(null);
  form.value = emptyForm();
}

async function saveDepartment() {
  if (!store.departmentToEdit) {
    return;
  }

  const result = await store.updateDepartment(store.departmentToEdit.id, {
    ...form.value,
    name: form.value.name.trim(),
  });

  if (result) {
    $q.notify({ type: 'positive', message: 'Department saved.' });
    closeDialog();
  } else if (store.error) {
    $q.notify({ type: 'negative', message: store.error });
  }
}

watch(
  () => store.departmentToEdit,
  (department) => {
    form.value = department ? departmentToForm(department) : emptyForm();
  },
  { immediate: true },
);
</script>

<style scoped>
.department-dialog {
  width: min(62vw, 860px);
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.department-dialog :deep(.q-card__section) {
  overflow-y: auto;
}

.dialog-header {
  flex: 0 0 auto;
  min-height: 112px;
  padding: 34px 32px 22px;
  overflow: visible;
}

.dialog-title {
  color: #000;
  font-size: 40px;
  font-weight: 400;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.dialog-close {
  color: #000;
}

@media (max-width: 1023px) {
  .department-dialog {
    width: 90vw;
  }
}
</style>
