<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section class="row items-center q-gutter-sm">
        <div>
          <div class="text-h6">Vacancy stages</div>
          <div class="text-caption text-grey-7">
            These stages are the vacancy (job) pipeline, separate from the candidate pipeline.
            Drag to reorder. Public careers lists jobs in stages marked “Lists publicly”.
          </div>
        </div>
        <q-space />
        <q-btn
          v-if="canEdit"
          color="primary"
          icon="add"
          label="Add stage"
          @click="openCreate"
        />
      </q-card-section>

      <q-card-section class="q-pa-none">
        <q-table
          :rows="store.stages"
          :columns="columns"
          row-key="id"
          flat
          bordered
          dense
          hide-pagination
          :loading="store.isLoadingStages"
          :pagination="{ rowsPerPage: 0 }"
          no-data-label="No vacancy stages"
        >
          <template #body="props">
            <q-tr
              :props="props"
              :class="{ 'stage-row--over': dragOverId === props.row.id }"
              @dragover.prevent="onDragOver(props.row.id)"
              @drop.prevent="onDrop(props.row.id)"
            >
              <q-td auto-width>
                <q-icon
                  name="drag_indicator"
                  class="stage-handle"
                  :draggable="canEdit"
                  @dragstart="onDragStart(props.row.id, $event)"
                  @dragend="onDragEnd"
                />
              </q-td>
              <q-td>
                <div class="row items-center no-wrap q-gutter-sm">
                  <span class="stage-swatch" :style="{ background: props.row.color }" />
                  <span>{{ props.row.name }}</span>
                </div>
              </q-td>
              <q-td>{{ props.row.is_default ? 'Yes' : '' }}</q-td>
              <q-td>{{ props.row.lists_public ? 'Yes' : '' }}</q-td>
              <q-td>{{ props.row.is_closed ? 'Yes' : '' }}</q-td>
              <q-td class="text-right">
                <q-btn
                  v-if="canEdit"
                  flat
                  round
                  dense
                  icon="edit"
                  color="primary"
                  @click="openEdit(props.row)"
                />
                <q-btn
                  v-if="canEdit"
                  flat
                  round
                  dense
                  icon="delete"
                  color="negative"
                  @click="confirmDelete(props.row)"
                />
              </q-td>
            </q-tr>
          </template>
        </q-table>
      </q-card-section>
    </q-card>

    <q-dialog v-model="dialogOpen" persistent>
      <q-card style="min-width: 360px">
        <q-card-section class="text-h6">
          {{ editing ? 'Edit stage' : 'New stage' }}
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-input v-model="form.name" outlined dense label="Name" />
          <q-input v-model="form.color" outlined dense label="Color" type="text">
            <template #append>
              <input v-model="form.color" type="color" class="stage-color-input" />
            </template>
          </q-input>
          <q-toggle v-model="form.is_default" label="Default for new vacancies" />
          <q-toggle v-model="form.lists_public" label="Lists publicly (published jobs)" />
          <q-toggle v-model="form.is_closed" label="Closed stage" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn v-close-popup flat label="Cancel" />
          <q-btn color="primary" :loading="store.isSaving" label="Save" @click="saveStage" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { type QTableProps, useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useVacancyStore, type VacancyStage } from '@hr/stores/vacancy-store';

defineProps<{ title?: string }>();

const store = useVacancyStore();
const { can } = usePermissions();
const $q = useQuasar();
const canEdit = computed(() => can('vacancies-crud'));

const dialogOpen = ref(false);
const editing = ref<VacancyStage | null>(null);
const dragId = ref<number | null>(null);
const dragOverId = ref<number | null>(null);

const form = reactive({
  name: '',
  color: '#64748b',
  is_default: false,
  lists_public: false,
  is_closed: false,
});

const columns: QTableProps['columns'] = [
  { name: 'handle', label: '', field: 'id', align: 'left' },
  { name: 'name', label: 'Stage', field: 'name', align: 'left' },
  { name: 'is_default', label: 'Default', field: 'is_default', align: 'left' },
  { name: 'lists_public', label: 'Lists publicly', field: 'lists_public', align: 'left' },
  { name: 'is_closed', label: 'Closed', field: 'is_closed', align: 'left' },
  { name: 'actions', label: '', field: 'actions', align: 'right' },
];

function openCreate() {
  editing.value = null;
  form.name = '';
  form.color = '#64748b';
  form.is_default = false;
  form.lists_public = false;
  form.is_closed = false;
  dialogOpen.value = true;
}

function openEdit(stage: VacancyStage) {
  editing.value = stage;
  form.name = stage.name;
  form.color = stage.color;
  form.is_default = stage.is_default;
  form.lists_public = stage.lists_public;
  form.is_closed = stage.is_closed;
  dialogOpen.value = true;
}

async function saveStage() {
  try {
    const payload = {
      name: form.name.trim(),
      color: form.color,
      is_default: form.is_default,
      lists_public: form.lists_public,
      is_closed: form.is_closed,
    };
    if (editing.value) {
      await store.updateStage(editing.value.id, payload);
      $q.notify({ type: 'positive', message: 'Stage updated.' });
    } else {
      await store.createStage(payload);
      $q.notify({ type: 'positive', message: 'Stage created.' });
    }
    dialogOpen.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save stage.',
    });
  }
}

function confirmDelete(stage: VacancyStage) {
  $q.dialog({
    title: 'Delete stage',
    message: `Delete "${stage.name}"? Vacancies must be moved out of this stage first.`,
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void deleteStage(stage);
  });
}

async function deleteStage(stage: VacancyStage) {
  try {
    await store.deleteStage(stage.id);
    $q.notify({ type: 'positive', message: 'Stage deleted.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not delete stage.',
    });
  }
}

function onDragStart(id: number, event: DragEvent) {
  dragId.value = id;
  event.dataTransfer?.setData('text/plain', String(id));
}

function onDragOver(id: number) {
  dragOverId.value = id;
}

function onDragEnd() {
  dragId.value = null;
  dragOverId.value = null;
}

async function onDrop(targetId: number) {
  const sourceId = dragId.value;
  onDragEnd();
  if (!sourceId || sourceId === targetId || !canEdit.value) {
    return;
  }

  const ids = store.stages.map((stage) => stage.id);
  const from = ids.indexOf(sourceId);
  const to = ids.indexOf(targetId);
  if (from < 0 || to < 0) {
    return;
  }
  ids.splice(from, 1);
  ids.splice(to, 0, sourceId);
  try {
    await store.reorderStages(ids);
  } catch (error) {
    await store.fetchStages();
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not reorder stages.',
    });
  }
}

onMounted(async () => {
  try {
    await store.fetchStages();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load stages.',
    });
  }
});
</script>

<style scoped>
.stage-handle {
  cursor: grab;
  color: #64748b;
}
.stage-swatch {
  width: 14px;
  height: 14px;
  border-radius: 4px;
  display: inline-block;
}
.stage-row--over {
  background: #eef2ff;
}
.stage-color-input {
  width: 28px;
  height: 28px;
  border: 0;
  background: transparent;
  cursor: pointer;
}
</style>
