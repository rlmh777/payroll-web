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
      :clearable="clearable"
      :loading="store.isLoadingEmployeeStatuses"
      @filter="filterOptions"
    >
      <template v-if="store.isLoadingEmployeeStatuses" #prepend>
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
            <q-item-label>Add New Employee Status</q-item-label>
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
              @click.stop="openEditDialog(scope.opt as EmployeeStatus)"
            >
              <q-tooltip>Edit Employee Status</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <AddEmployeeStatus v-model="showAddDialog" @saved="onSaved" />
    <EditEmployeeStatus
      v-model="showEditDialog"
      :employee-status="selectedItem"
      @updated="onUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue';
import { useEmployeeStatusStore, type EmployeeStatus } from 'src/stores/employee-status-store';
import AddEmployeeStatus from './AddEmployeeStatus.vue';
import EditEmployeeStatus from './EditEmployeeStatus.vue';

const props = withDefaults(defineProps<{
  modelValue?: number | null;
  label?: string;
  disable?: boolean;
  clearable?: boolean;
  showAddNew?: boolean;
  showEdit?: boolean;
}>(), {
  modelValue: null,
  label: 'Employee Status',
  disable: false,
  clearable: false,
  showAddNew: true,
  showEdit: true,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
}>();

const store = useEmployeeStatusStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedItem = ref<EmployeeStatus | null>(null);
const options = ref<(EmployeeStatus | { id: number | string; name: string })[]>([]);

const buildOptions = (items: EmployeeStatus[]) => {
  const list: (EmployeeStatus | { id: number | string; name: string })[] = [...items];
  if (props.showAddNew && !props.disable) {
    list.unshift({ id: 'add-new', name: 'Add New Employee Status' });
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
      ? store.employeeStatuses.filter((item) => item.name.toLowerCase().includes(search))
      : store.employeeStatuses;
    options.value = buildOptions(filtered);
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(item: EmployeeStatus) {
  selectedItem.value = item;
  showEditDialog.value = true;
}

async function onSaved(id: number) {
  await store.fetchEmployeeStatuses();
  await nextTick();
  options.value = buildOptions(store.employeeStatuses);
  emit('update:modelValue', id);
}

async function onUpdated() {
  await store.fetchEmployeeStatuses();
  options.value = buildOptions(store.employeeStatuses);
}

onMounted(async () => {
  if (store.employeeStatuses.length === 0) {
    await store.fetchEmployeeStatuses();
  }
  options.value = buildOptions(store.employeeStatuses);
});
</script>
