<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <div>
          <div class="text-h6">Form templates</div>
          <div class="text-caption text-grey-7">
            Build reusable forms. Assign them to the company, a department, a group, or people. Score sheets can also be attached to vacancies.
          </div>
        </div>
        <q-space />
        <q-btn v-if="canEdit" color="primary" icon="add" label="New template" @click="openCreate" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-table
          flat
          bordered
          dense
          row-key="id"
          :rows="store.templates"
          :columns="columns"
          :loading="store.isLoading"
          no-data-label="No form templates"
        >
          <template #body-cell-purpose="props">
            <q-td :props="props">
              {{ purposeLabel(props.row.purpose) }}
            </q-td>
          </template>
          <template #body-cell-is_active="props">
            <q-td :props="props">
              <q-badge :color="props.row.is_active ? 'positive' : 'grey'">
                {{ props.row.is_active ? 'Active' : 'Inactive' }}
              </q-badge>
            </q-td>
          </template>
          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <q-btn v-if="canEdit" flat round dense icon="send" color="primary" @click="openAssign(props.row)">
                <q-tooltip>Distribute</q-tooltip>
              </q-btn>
              <q-btn v-if="canEdit" flat round dense icon="edit" color="primary" @click="openEdit(props.row)" />
              <q-btn v-if="canEdit" flat round dense icon="delete" color="negative" @click="confirmDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <FormBuilderDialog v-model="dialogOpen" :record="editing" @saved="store.fetchTemplates()" />
    <FormAssignmentDialog v-model="assignOpen" :template="assigning" />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import FormAssignmentDialog from '@hr/components/forms/FormAssignmentDialog.vue';
import FormBuilderDialog from '@hr/components/forms/FormBuilderDialog.vue';
import { useFormTemplateStore, type FormTemplate } from '@hr/stores/form-template-store';

const store = useFormTemplateStore();
const { can } = usePermissions();
const $q = useQuasar();
const canEdit = computed(() => can('vacancies-crud') || can('form-templates-crud'));
const dialogOpen = ref(false);
const assignOpen = ref(false);
const editing = ref<FormTemplate | null>(null);
const assigning = ref<FormTemplate | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  { name: 'purpose', label: 'Purpose', field: 'purpose', align: 'left' },
  { name: 'max_score', label: 'Max score', field: 'max_score', align: 'left' },
  { name: 'is_active', label: 'Status', field: 'is_active', align: 'left' },
  { name: 'actions', label: '', field: 'id', align: 'right' },
];

function openCreate() {
  editing.value = null;
  dialogOpen.value = true;
}

function purposeLabel(purpose: FormTemplate['purpose']) {
  if (purpose === 'score_sheet') {
    return 'Score sheet';
  }
  if (purpose === 'feedback') {
    return 'Feedback';
  }
  if (purpose === 'appraisal') {
    return 'Appraisal';
  }
  return 'General';
}

function openEdit(row: FormTemplate) {
  editing.value = row;
  dialogOpen.value = true;
}

function openAssign(row: FormTemplate) {
  assigning.value = row;
  assignOpen.value = true;
}

function confirmDelete(row: FormTemplate) {
  $q.dialog({
    title: 'Delete template?',
    message: `Delete ${row.name}? Vacancies using it will have no score sheet until another is assigned.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void store.deleteTemplate(row.id).then(
      () => $q.notify({ type: 'positive', message: 'Template deleted.' }),
      (error: unknown) => {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Could not delete template.',
        });
      },
    );
  });
}

onMounted(() => {
  void store.fetchTemplates();
});
</script>
