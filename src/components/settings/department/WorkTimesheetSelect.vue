<template>
  <div>
    <q-select
      v-model="selectedTimesheetId"
      :options="timesheetOptions"
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
      :loading="workTimesheetStore.isLoading"
      @filter="filterTimesheets"
    >
      <template v-if="workTimesheetStore.isLoading" #prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template #option="scope">
        <q-item
          v-if="scope.opt.id === 'add-new'"
          clickable
          v-close-popup
          @click="openCreateDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Working Hours Timesheet</q-item-label>
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
              @click.stop="openEditDialog(scope.opt as WorkTimesheet)"
            >
              <q-tooltip>Edit Working Hours Timesheet</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <WorkTimesheetDialog
      v-model="showDialog"
      :days="days"
      :title="editingTimesheetId ? 'Edit Working Hours Timesheet' : 'Add a Working Hours Timesheet'"
      :initial-value="selectedTimesheet"
      @save="saveTimesheet"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useWorkTimesheetStore, type WorkTimesheet, type WorkTimesheetPayload } from 'src/stores/work-timesheet-store';
import WorkTimesheetDialog from 'src/components/settings/work-timesheet/WorkTimesheetDialog.vue';

type WorkTimesheetForm = {
  name: string;
  startTime: string;
  endTime: string;
  days: string[];
};

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
  showEdit?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Working hour timesheet',
  showAddNew: false,
  showEdit: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const $q = useQuasar();
const workTimesheetStore = useWorkTimesheetStore();
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const filterText = ref('');
const showDialog = ref(false);
const editingTimesheetId = ref<string | null>(null);
const selectedTimesheet = ref<WorkTimesheetForm | null>(null);

const timesheetOptions = computed(() => {
  const search = filterText.value.trim().toLowerCase();
  const filtered = workTimesheetStore.workTimesheets.filter((timesheet) =>
    !search || timesheet.name.toLowerCase().includes(search),
  );

  const options: Array<WorkTimesheet | { id: string; name: string }> = [...filtered];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Working Hours Timesheet' });
  }

  return options;
});

const selectedTimesheetId = computed({
  get: (): string | null => props.modelValue ?? null,
  set: (value: string | null) => {
    if (value === 'add-new') {
      openCreateDialog();
      return;
    }

    emit('update:modelValue', value);
    emit('change', value);
  },
});

function normalizeTime(value: string) {
  return value.slice(0, 5);
}

function filterTimesheets(val: string, update: (callback: () => void) => void) {
  update(() => {
    filterText.value = val;
  });
}

function openCreateDialog() {
  editingTimesheetId.value = null;
  selectedTimesheet.value = null;
  showDialog.value = true;
}

function openEditDialog(timesheet: WorkTimesheet) {
  editingTimesheetId.value = timesheet.id;
  selectedTimesheet.value = {
    name: timesheet.name,
    startTime: normalizeTime(timesheet.start_time),
    endTime: normalizeTime(timesheet.end_time),
    days: Array.isArray(timesheet.days) ? [...timesheet.days] : [],
  };
  showDialog.value = true;
}

async function saveTimesheet(formData: WorkTimesheetForm) {
  if (!formData.name.trim() || !formData.startTime || !formData.endTime) {
    $q.notify({ type: 'negative', message: 'Fill in name, start time, and end time.' });
    return;
  }

  const payload: WorkTimesheetPayload = {
    name: formData.name.trim(),
    start_time: normalizeTime(formData.startTime),
    end_time: normalizeTime(formData.endTime),
    days: formData.days,
  };

  const result = editingTimesheetId.value
    ? await workTimesheetStore.updateWorkTimesheet(editingTimesheetId.value, payload)
    : await workTimesheetStore.createWorkTimesheet(payload);

  if (result) {
    $q.notify({
      type: 'positive',
      message: editingTimesheetId.value ? 'Work timesheet updated.' : 'Work timesheet saved.',
    });
    emit('update:modelValue', result.id);
    emit('change', result.id);
    showDialog.value = false;
    editingTimesheetId.value = null;
    selectedTimesheet.value = null;
  } else if (workTimesheetStore.error) {
    $q.notify({ type: 'negative', message: workTimesheetStore.error });
  }
}

onMounted(async () => {
  if (workTimesheetStore.workTimesheets.length === 0) {
    await workTimesheetStore.fetchWorkTimesheets();
  }
});
</script>

<style scoped>
</style>
