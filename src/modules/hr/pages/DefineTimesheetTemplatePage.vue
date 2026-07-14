<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div>
        <div class="text-h5 text-weight-bold">{{ title }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Define default work schedules by department and day. Departments can override these templates.
        </div>
      </div>
      <q-btn color="primary" icon="add" label="Add template" @click="openCreateDialog" />
    </div>

    <TimesheetTemplateTable
      :rows="rows"
      :loading="timesheetTemplateStore.isLoading"
      @edit="openEditDialog"
    />

    <TimesheetTemplateDialog
      v-model="showDialog"
      :title="editingTimesheetId ? 'Edit Timesheet Template' : 'Add a Timesheet Template'"
      :initial-value="selectedTimesheet"
      @save="saveTimesheet"
    />
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import TimesheetTemplateDialog from '@hr/components/settings/timesheet-template/TimesheetTemplateDialog.vue';
import TimesheetTemplateTable, {
  type TimesheetTemplateTableRow,
} from '@hr/components/settings/timesheet-template/TimesheetTemplateTable.vue';
import { useTimesheetTemplateStore } from '@hr/stores/timesheet-template-store';
import {
  formToPayload,
  formatLunchSummary,
  formatScheduleSummary,
  timesheetToForm,
  validateTimesheetTemplateForm,
  type TimesheetTemplateForm,
} from '@hr/utils/timesheet-template-utils';

const props = withDefaults(
  defineProps<{
    title?: string;
  }>(),
  {
    title: 'Timesheet Templates',
  },
);

const title = computed(() => props.title);

const $q = useQuasar();
const timesheetTemplateStore = useTimesheetTemplateStore();
const { timesheetTemplates, error } = storeToRefs(timesheetTemplateStore);

const showDialog = ref(false);
const editingTimesheetId = ref<string | null>(null);
const selectedTimesheet = ref<TimesheetTemplateForm | null>(null);

const rows = computed<TimesheetTemplateTableRow[]>(() =>
  timesheetTemplates.value.map((template) => ({
    id: template.id,
    name: template.name,
    scheduleSummary: formatScheduleSummary(template),
    lunchSummary: formatLunchSummary(template),
    template,
  })),
);

function openCreateDialog() {
  editingTimesheetId.value = null;
  selectedTimesheet.value = null;
  showDialog.value = true;
}

function openEditDialog(row: TimesheetTemplateTableRow) {
  editingTimesheetId.value = row.id;
  selectedTimesheet.value = timesheetToForm(row.template);
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
    showDialog.value = false;
    editingTimesheetId.value = null;
    selectedTimesheet.value = null;
  } else if (error.value) {
    $q.notify({ type: 'negative', message: error.value });
  }
}

onMounted(async () => {
  if (!timesheetTemplates.value.length) {
    await timesheetTemplateStore.fetchTimesheetTemplates();
  }
});
</script>
