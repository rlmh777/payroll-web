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
      :label="label"
      :disable="disable"
      :loading="store.isLoadingEmploymentStatuses"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingEmploymentStatuses" #prepend>
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
            <q-item-label>Add New Employment Status</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !disable" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as EmploymentStatus)"
            >
              <q-tooltip>Edit Employment Status</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddEmploymentStatus v-model="showAddDialog" @saved="onSaved" />
    <EditEmploymentStatus
      v-model="showEditDialog"
      :employment-status="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useEmploymentStatusStore, type EmploymentStatus } from 'src/stores/employment-status-store';
import AddEmploymentStatus from './AddEmploymentStatus.vue';
import EditEmploymentStatus from './EditEmploymentStatus.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Employment Status',
  disable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useEmploymentStatusStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<EmploymentStatus | null>(null);
const options = ref<(EmploymentStatus | { id: number | string; name: string })[]>([]);

const buildOptions = (items: EmploymentStatus[]) => {
  const list: (EmploymentStatus | { id: number | string; name: string })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Employment Status' });
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
      ? store.employmentStatuses.filter((item) => item.name.toLowerCase().includes(search))
      : store.employmentStatuses;
    options.value = buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: EmploymentStatus) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(id: number) {
  await store.fetchEmploymentStatuses();
  await nextTick();
  options.value = buildOptions(store.employmentStatuses);
  emit('update:modelValue', id);
}

async function onUpdated() {
  await store.fetchEmploymentStatuses();
  options.value = buildOptions(store.employmentStatuses);
}

onMounted(async () => {
  if (store.employmentStatuses.length === 0) {
    await store.fetchEmploymentStatuses();
  }
  options.value = buildOptions(store.employmentStatuses);
});
</script>
