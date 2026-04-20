<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false">
    <q-card class="department-dialog">
      <q-card-section class="row items-center no-wrap dialog-header">
        <div class="dialog-title">Create Department</div>
        <q-space />
        <q-btn flat round icon="close" size="lg" class="dialog-close" :disable="store.isSaving" @click="closeDialog" />
      </q-card-section>

      <DepartmentForm
        v-model="form"
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
import { useDepartmentStore, type DepartmentPayload } from 'src/stores/department-store';
import DepartmentForm from './DepartmentForm.vue';

const store = useDepartmentStore();
const $q = useQuasar();
const form = ref<DepartmentPayload>(emptyForm());

const isOpen = computed({
  get: () => store.isCreateOpen,
  set: (value: boolean) => {
    if (!value) {
      closeDialog();
    } else {
      store.isCreateOpen = value;
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

function closeDialog() {
  store.closeCreateDialog();
  form.value = emptyForm();
}

async function saveDepartment() {
  const result = await store.createDepartment({
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
  () => store.isCreateOpen,
  (isOpen) => {
    if (isOpen) {
      form.value = emptyForm();
    }
  },
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
