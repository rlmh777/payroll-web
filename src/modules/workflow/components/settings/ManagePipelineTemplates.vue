<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <div class="col">
          <div class="text-h6">Pipeline templates</div>
          <div class="text-body2 text-grey-7">
            Configure approval workflows used across leave, timesheets, and future modules.
          </div>
        </div>
        <q-btn
          v-if="canCrud"
          color="primary"
          icon="add"
          label="Add template"
          @click="openCreate"
        />
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
          no-data-label="No pipeline templates"
        >
          <template #body-cell-subjectType="props">
            <q-td :props="props">{{ subjectLabel(props.row.subjectType) }}</q-td>
          </template>

          <template #body-cell-steps="props">
            <q-td :props="props">{{ formatSteps(props.row.steps) }}</q-td>
          </template>

          <template #body-cell-isActive="props">
            <q-td :props="props">
              <q-icon
                :name="props.row.isActive ? 'check_circle' : 'cancel'"
                :color="props.row.isActive ? 'positive' : 'grey'"
              />
            </q-td>
          </template>

          <template #body-cell-actions="props">
            <q-td :props="props" class="text-right">
              <template v-if="canCrud">
                <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
                <q-btn flat round dense icon="delete" color="negative" size="sm" @click="confirmDelete(props.row)" />
              </template>
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <PipelineTemplateFormDialog
      v-model="showFormDialog"
      :template="editingTemplate"
      @saved="refresh"
    />
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import { useCrudPermission } from '@core/composables/useCrudPermission';
import PipelineTemplateFormDialog from './PipelineTemplateFormDialog.vue';
import {
  usePipelineTemplateStore,
  type PipelineTemplate,
} from '@workflow/stores/pipeline-template-store';

const $q = useQuasar();
const store = usePipelineTemplateStore();
const { canCrud } = useCrudPermission('pipelineTemplate');

const showFormDialog = ref(false);
const editingTemplate = ref<PipelineTemplate | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'key', label: 'Key', field: 'key', align: 'left' },
  { name: 'subjectType', label: 'Subject', field: 'subjectType', align: 'left' },
  { name: 'steps', label: 'Steps', field: 'steps', align: 'left' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function subjectLabel(value: string) {
  return store.meta.subjectTypes.find((option) => option.value === value)?.label ?? value;
}

function formatSteps(steps: PipelineTemplate['steps'] | undefined) {
  if (!steps?.length) {
    return '—';
  }

  return steps.map((step) => step.label).join(' → ');
}

async function refresh() {
  await Promise.all([store.fetchMeta(), store.fetchTemplates()]);
}

function openCreate() {
  editingTemplate.value = null;
  showFormDialog.value = true;
}

function openEdit(template: PipelineTemplate) {
  editingTemplate.value = template;
  showFormDialog.value = true;
}

function confirmDelete(template: PipelineTemplate) {
  $q.dialog({
    title: 'Delete pipeline template',
    message: `Delete "${template.name}"? Templates with existing instances cannot be deleted.`,
    cancel: true,
    persistent: true,
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteTemplate(template.id);
        $q.notify({ type: 'positive', message: 'Pipeline template deleted.' });
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Failed to delete pipeline template.',
        });
      }
    })();
  });
}

onMounted(async () => {
  await refresh();
});
</script>
