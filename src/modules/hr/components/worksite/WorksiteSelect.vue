<template>
  <div>
    <q-select
      v-model="selectedId"
      :options="options"
      option-value="id"
      option-label="name"
      emit-value
      map-options
      use-input
      fill-input
      hide-selected
      input-debounce="300"
      outlined
      dense
      :clearable="clearable"
      :label="label"
      :disable="disable"
      :loading="store.isLoadingWorksites"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingWorksites" #prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template #option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openAddDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Work Site</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.address1" caption class="text-grey-6">
              {{ scope.opt.address1 }}
            </q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as Worksite)"
            >
              <q-tooltip>Edit Work Site</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddWorksiteDialog v-model="showAddDialog" @saved="onSaved" />
    <EditWorksiteDialog
      v-model="showEditDialog"
      :worksite="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useWorksiteStore, type Worksite } from 'src/stores/worksite-store';
import AddWorksiteDialog from './AddWorksiteDialog.vue';
import EditWorksiteDialog from './EditWorksiteDialog.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  clearable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Worksite',
  disable: false,
  clearable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useWorksiteStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<Worksite | null>(null);
const options = ref<(Worksite | { id: number | string; name: string })[]>([]);

const buildOptions = (items: Worksite[]) => {
  const list: (Worksite | { id: number | string; name: string })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Work Site' });
  }
  return list;
};

const selectedId = computed({
  get: () => props.modelValue ?? null,
  set: (value: number | string | null) => {
    if (value === 'add-new') {
      openAddDialog();
      return;
    }
    emit('update:modelValue', typeof value === 'number' ? value : null);
  },
});

function filterOptions(val: string, update: (fn: () => void) => void) {
  update(() => {
    const search = val?.trim().toLowerCase() ?? '';
    const filtered = search
      ? store.worksites.filter((item) =>
          item.name.toLowerCase().includes(search) ||
          item.address1.toLowerCase().includes(search),
        )
      : store.worksites;
    options.value = buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: Worksite) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(id: number) {
  await store.fetchWorksites(1, 100);
  await nextTick();
  options.value = buildOptions(store.worksites);
  emit('update:modelValue', id);
}

async function onUpdated() {
  await store.fetchWorksites(1, 100);
  options.value = buildOptions(store.worksites);
}

onMounted(async () => {
  if (store.worksites.length === 0) {
    await store.fetchWorksites(1, 100);
  }
  options.value = buildOptions(store.worksites);
});
</script>
