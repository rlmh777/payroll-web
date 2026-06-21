<template>
  <div>
    <q-select
      v-model="selectedDepartmentId"
      :options="departmentOptions"
      option-value="id"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="0"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      :clearable="clearable"
      :label="label"
      @filter="filterDepartments"
    >
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
            <q-item-label>Add New Department</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as Department)"
            >
              <q-tooltip>Edit Department</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <DepartmentEditorDialog
      v-model="showAddDialog"
      title="Create Department"
      :exclude-department-id="excludeDepartmentId ?? null"
      @saved="onDepartmentSaved"
    />

    <DepartmentEditorDialog
      v-model="showEditDialog"
      title="Edit Department"
      :department-id="selectedDepartment?.id ?? null"
      :exclude-department-id="selectedDepartment?.id ?? excludeDepartmentId ?? null"
      :initial-value="selectedDepartmentForm"
      @saved="onDepartmentUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useDepartmentStore, type Department, type DepartmentPayload } from 'src/stores/department-store';
import DepartmentEditorDialog from './DepartmentEditorDialog.vue';

interface Props {
  modelValue?: number | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: number | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
  showEdit?: boolean;
  excludeDepartmentId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Parent department',
  showAddNew: false,
  showEdit: false,
  excludeDepartmentId: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: number | null];
  'change': [value: number | null];
}>();

const departmentStore = useDepartmentStore();
const showAddDialog = ref(false);
const showEditDialog = ref(false);
const selectedDepartment = ref<Department | null>(null);
const filterText = ref('');

const baseDepartmentOptions = computed(() =>
  departmentStore.departmentOptions.filter((department) => department.id !== props.excludeDepartmentId),
);

const departmentOptions = computed(() => {
  const search = filterText.value.trim().toLowerCase();
  const options = baseDepartmentOptions.value.filter((department) =>
    !search || department.name.toLowerCase().includes(search),
  );

  const mapped: Array<Department | { id: string; name: string }> = [...options];
  if (props.showAddNew && !props.readonly) {
    mapped.unshift({ id: 'add-new', name: 'Add New Department' });
  }

  return mapped;
});

const selectedDepartmentId = computed({
  get: (): number | null => props.modelValue ?? null,
  set: (value: number | string | null) => {
    if (value === 'add-new') {
      openAddDialog();
      return;
    }

    const normalized = typeof value === 'number' ? value : value ? Number(value) : null;
    emit('update:modelValue', normalized);
    emit('change', normalized);
  },
});

const selectedDepartmentForm = computed<DepartmentPayload | null>(() => {
  if (!selectedDepartment.value) {
    return null;
  }

  return {
    name: selectedDepartment.value.name,
    parentId: selectedDepartment.value.parentId ?? null,
    work_timesheet_id:
      selectedDepartment.value.current_work_timesheet_assignment?.work_timesheet_id ??
      selectedDepartment.value.current_work_timesheet_assignment?.work_timesheet?.id ??
      null,
  };
});

function filterDepartments(val: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = val;
  });
}

function openAddDialog() {
  showAddDialog.value = true;
}

function openEditDialog(department: Department) {
  selectedDepartment.value = department;
  showEditDialog.value = true;
}

function onDepartmentSaved(department: Department) {
  emit('update:modelValue', department.id);
  emit('change', department.id);
}

function onDepartmentUpdated(department: Department) {
  selectedDepartment.value = department;
  if (props.modelValue === department.id) {
    emit('update:modelValue', department.id);
    emit('change', department.id);
  }
}

onMounted(async () => {
  if (departmentStore.departmentOptions.length === 0) {
    await departmentStore.fetchDepartmentOptions();
  }
});
</script>

<style scoped>
</style>
