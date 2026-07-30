<template>
  <div>
    <div class="text-body2 text-grey-7 q-mb-md">
      Employee documents with tags, names, descriptions, and uploaded files.
    </div>

    <div class="row items-center q-mb-md q-gutter-sm">
      <q-btn color="primary" icon="add" label="Add document" dense @click="openCreate" />
    </div>

    <q-table
      :rows="store.records"
      :columns="columns"
      row-key="id"
      flat
      bordered
      dense
      :loading="store.isLoading"
      no-data-label="No documents"
      :pagination="{ rowsPerPage: 20 }"
    >
      <template #body-cell-tag="props">
        <q-td :props="props">
          <DocumentTagChip
            v-if="props.row.documentTagId"
            :label="tagLabel(props.row)"
            :color="tagColor(props.row)"
          />
          <span v-else>—</span>
        </q-td>
      </template>
      <template #body-cell-file="props">
        <q-td :props="props">
          <q-btn
            v-if="fileUrl(props.row)"
            flat
            dense
            no-caps
            color="primary"
            icon="download"
            :label="fileLabel(props.row)"
            :href="fileUrl(props.row) ?? undefined"
            target="_blank"
            rel="noopener noreferrer"
          />
          <span v-else>—</span>
        </q-td>
      </template>
      <template #body-cell-actions="props">
        <q-td :props="props" class="text-right">
          <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
          <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
        </q-td>
      </template>
    </q-table>

    <EmployeeDocumentFormDialog
      v-model="dialogOpen"
      :employee-id="employeeId"
      :record="selectedRecord"
      @saved="refresh"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import EmployeeDocumentFormDialog from './EmployeeDocumentFormDialog.vue';
import DocumentTagChip from '@core/settings/document-tag/DocumentTagChip.vue';
import {
  employeeDocumentDisplayName,
  resolveEmployeeDocumentFileUrl,
} from './employee-document-form';
import {
  buildDocumentTagPath,
  resolveDocumentTag,
  resolveDocumentTagColor,
  useDocumentTagStore,
} from 'src/stores/document-tag-store';
import {
  useEmployeeDocumentStore,
  type EmployeeDocument,
} from 'src/stores/employee-document-store';

const props = defineProps<{ employeeId: string }>();

const store = useEmployeeDocumentStore();
const tagStore = useDocumentTagStore();
const $q = useQuasar();
const dialogOpen = ref(false);
const selectedRecord = ref<EmployeeDocument | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'name', label: 'Name', field: 'name', align: 'left' },
  {
    name: 'tag',
    label: 'Tag',
    field: (r) => tagLabel(r),
    align: 'left',
  },
  { name: 'file', label: 'File', field: 'file', align: 'left' },
  { name: 'description', label: 'Description', field: (r) => r.description ?? '—', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function tagLabel(record: EmployeeDocument) {
  if (!record.documentTagId) {
    return '—';
  }
  return buildDocumentTagPath(tagStore.tagOptions, record.documentTagId)
    || record.documentTag?.name
    || '—';
}

function tagColor(record: EmployeeDocument) {
  const tag = resolveDocumentTag(tagStore.tagOptions, record.documentTagId)
    ?? record.documentTag
    ?? null;
  return resolveDocumentTagColor(tag?.color ?? null);
}

function fileUrl(record: EmployeeDocument) {
  return resolveEmployeeDocumentFileUrl(record.fileUrl, record.filePath);
}

function fileLabel(record: EmployeeDocument) {
  return employeeDocumentDisplayName(record.fileName, record.filePath) ?? 'Download';
}

function openCreate() {
  selectedRecord.value = null;
  dialogOpen.value = true;
}

function openEdit(record: EmployeeDocument) {
  selectedRecord.value = record;
  dialogOpen.value = true;
}

async function refresh() {
  await store.fetchByEmployee(props.employeeId);
}

function onDelete(row: EmployeeDocument) {
  $q.dialog({
    title: 'Confirm delete',
    message: `Delete "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteRecord(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Document deleted.' });
      } catch (error) {
        $q.notify({
          color: 'negative',
          position: 'top',
          message: error instanceof Error ? error.message : 'Delete failed.',
        });
      }
    })();
  });
}

watch(
  () => props.employeeId,
  async () => {
    if (tagStore.tagOptions.length === 0) {
      await tagStore.fetchTagOptions();
    }
    await refresh();
  },
  { immediate: true },
);
</script>
