<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-card-section class="row items-center q-gutter-sm">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          label="Search document tags"
          class="col-grow"
          @keyup.enter="refresh"
        />
        <q-btn color="primary" icon="add" label="Add tag" @click="openCreate" />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          title="Document tags"
          :rows="store.tags"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          :loading="store.isLoading"
          v-model:pagination="pagination"
          :rows-per-page-options="[10, 25, 50]"
          @request="onRequest"
          no-data-label="No document tags"
        >
          <template #body-cell-color="props">
            <q-td :props="props">
              <DocumentTagChip :label="props.row.name" :color="props.row.color ?? null" />
            </q-td>
          </template>
          <template #body-cell-parent="props">
            <q-td :props="props">
              {{ parentLabel(props.row) }}
            </q-td>
          </template>
          <template #body-cell-path="props">
            <q-td :props="props">
              <DocumentTagChip
                :label="tagPath(props.row.id) || props.row.name"
                :color="props.row.color ?? null"
              />
            </q-td>
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
              <q-btn flat round dense icon="edit" color="primary" size="sm" @click="openEdit(props.row)" />
              <q-btn flat round dense icon="delete" color="negative" size="sm" @click="onDelete(props.row)" />
            </q-td>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <DocumentTagFormDialog
      v-model="showDialog"
      :tag-id="editingId"
      @saved="onSaved"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar, type QTableProps } from 'quasar';
import DocumentTagChip from './DocumentTagChip.vue';
import DocumentTagFormDialog from './DocumentTagFormDialog.vue';
import {
  buildDocumentTagPath,
  useDocumentTagStore,
  type DocumentTag,
} from 'src/stores/document-tag-store';

const $q = useQuasar();
const store = useDocumentTagStore();

const search = computed({
  get: () => store.search,
  set: (value: string) => {
    store.search = value;
  },
});

const pagination = ref({
  page: 1,
  rowsPerPage: 25,
  rowsNumber: 0,
});

const showDialog = ref(false);
const editingId = ref<string | null>(null);

const columns: QTableProps['columns'] = [
  { name: 'path', label: 'Full path', field: 'path', align: 'left' },
  { name: 'color', label: 'Color', field: 'color', align: 'left' },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  { name: 'parent', label: 'Parent', field: 'parent', align: 'left' },
  { name: 'description', label: 'Description', field: (r) => r.description ?? '—', align: 'left' },
  { name: 'sortOrder', label: 'Order', field: 'sortOrder', align: 'right' },
  { name: 'isActive', label: 'Active', field: 'isActive', align: 'center' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

const allTagsForPath = computed(() => [...store.tags, ...store.tagOptions]);

function parentLabel(row: DocumentTag) {
  return row.parent?.name ?? '—';
}

function tagPath(tagId: string) {
  return buildDocumentTagPath(allTagsForPath.value, tagId);
}

function openCreate() {
  editingId.value = null;
  showDialog.value = true;
}

function openEdit(row: DocumentTag) {
  editingId.value = row.id;
  showDialog.value = true;
}

async function refresh() {
  await store.fetchTags(pagination.value.page, pagination.value.rowsPerPage);
  pagination.value.rowsNumber = store.total;
}

async function onRequest(props: { pagination: { page: number; rowsPerPage: number } }) {
  pagination.value.page = props.pagination.page;
  pagination.value.rowsPerPage = props.pagination.rowsPerPage;
  await refresh();
}

function onSaved() {
  void refresh();
}

function onDelete(row: DocumentTag) {
  $q.dialog({
    title: 'Delete document tag',
    message: `Delete "${row.name}"?`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void (async () => {
      try {
        await store.deleteTag(row.id);
        $q.notify({ color: 'positive', position: 'top', message: 'Tag deleted.' });
        await refresh();
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

watch(search, () => {
  pagination.value.page = 1;
  void refresh();
});

onMounted(async () => {
  await Promise.all([
    store.fetchTagOptions(),
    refresh(),
  ]);
});
</script>
