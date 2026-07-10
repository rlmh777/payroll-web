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
      :loading="timesheetTemplateStore.isLoading"
      @filter="filterTimesheets"
    >
      <template v-if="timesheetTemplateStore.isLoading" #prepend>
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
            <q-item-label>Add New Timesheet Template</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label caption>{{ formatScheduleSummary(scope.opt) }}</q-item-label>
          </q-item-section>
          <q-item-section v-if="showEdit && !readonly" side>
            <q-btn
              flat
              round
              dense
              icon="edit"
              color="primary"
              size="sm"
              @click.stop="openEditDialog(scope.opt as TimesheetTemplate)"
            >
              <q-tooltip>Edit Timesheet Template</q-tooltip>
            </q-btn>
          </q-item-section>
        </q-item>
      </template>
    </q-select>

    <TimesheetTemplateDialog
      v-model="showDialog"
      :title="editingTimesheetId ? 'Edit Timesheet Template' : 'Add a Timesheet Template'"
      :initial-value="selectedTimesheet"
      :default-department-id="resolvedDefaultDepartmentId"
      @save="saveTimesheet"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useTimesheetTemplateStore, type TimesheetTemplate } from 'src/stores/timesheet-template-store';
import TimesheetTemplateDialog from 'src/components/settings/timesheet-template/TimesheetTemplateDialog.vue';
import {
  formToPayload,
  formatScheduleSummary,
  timesheetToForm,
  validateTimesheetTemplateForm,
  type TimesheetTemplateForm,
} from 'src/utils/timesheet-template-utils';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
  showEdit?: boolean;
  defaultDepartmentId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Timesheet template',
  showAddNew: false,
  showEdit: false,
  defaultDepartmentId: null,
});

const resolvedDefaultDepartmentId = computed((): number | null => props.defaultDepartmentId ?? null);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  change: [value: string | null];
}>();

const $q = useQuasar();
const timesheetTemplateStore = useTimesheetTemplateStore();
const filterText = ref('');
const showDialog = ref(false);
const editingTimesheetId = ref<string | null>(null);
const selectedTimesheet = ref<TimesheetTemplateForm | null>(null);

const timesheetOptions = computed(() => {
  const search = filterText.value.trim().toLowerCase();
  const filtered = timesheetTemplateStore.timesheetTemplates.filter(
    (timesheet) => !search || timesheet.name.toLowerCase().includes(search),
  );

  const options: Array<TimesheetTemplate | { id: string; name: string }> = [...filtered];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Timesheet Template' });
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

function openEditDialog(timesheet: TimesheetTemplate) {
  editingTimesheetId.value = timesheet.id;
  selectedTimesheet.value = timesheetToForm(timesheet);
  showDialog.value = true;
}

async function saveTimesheet(formData: TimesheetTemplateForm) {
  const validationError = validateTimesheetTemplateForm(formData);
  if (validationError) {
    $q.notify({ type: 'negative', message: validationError });
    return;
  }

  const payload = formToPayload(formData);

  const result = editingTimesheetId.value
    ? await timesheetTemplateStore.updateTimesheetTemplate(editingTimesheetId.value, payload)
    : await timesheetTemplateStore.createTimesheetTemplate(payload);

  if (result) {
    $q.notify({
      type: 'positive',
      message: editingTimesheetId.value ? 'Timesheet template updated.' : 'Timesheet template saved.',
    });
    emit('update:modelValue', result.id);
    emit('change', result.id);
    showDialog.value = false;
    editingTimesheetId.value = null;
    selectedTimesheet.value = null;
  } else if (timesheetTemplateStore.error) {
    $q.notify({ type: 'negative', message: timesheetTemplateStore.error });
  }
}

onMounted(async () => {
  if (timesheetTemplateStore.timesheetTemplates.length === 0) {
    await timesheetTemplateStore.fetchTimesheetTemplates();
  }
});
</script>
