<template>
  <q-dialog v-model="isOpen" position="right" @hide="onHide">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit Incident' : 'Add Incident' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form id="employee-incident-form" @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12 col-sm-6">
              <DateField
                v-model="form.incidentDate"
                label="Incident date *"
                required
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <DateField
                v-model="form.reportedDate"
                label="Reported date"
                clearable
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.incidentType"
                :options="[...INCIDENT_TYPE_OPTIONS]"
                emit-value
                map-options
                outlined
                dense
                label="Type *"
                :rules="[(v) => !!v || 'Type is required']"
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.severity"
                :options="[...INCIDENT_SEVERITY_OPTIONS]"
                emit-value
                map-options
                outlined
                dense
                label="Severity *"
                :rules="[(v) => !!v || 'Severity is required']"
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.title"
                label="Title *"
                outlined
                dense
                :rules="[(v) => !!v?.trim() || 'Title is required']"
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.description"
                type="textarea"
                label="Description"
                outlined
                dense
                autogrow
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.status"
                :options="[...INCIDENT_STATUS_OPTIONS]"
                emit-value
                map-options
                outlined
                dense
                label="Status"
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <DepartmentSelect
                v-model="form.departmentId"
                label="Department"
                clearable
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <WorksiteSelect
                v-model="form.worksiteId"
                label="Worksite"
                clearable
                :show-add-new="false"
                :show-edit="false"
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-select
                v-model="form.actionTaken"
                :options="[...INCIDENT_ACTION_OPTIONS]"
                emit-value
                map-options
                outlined
                dense
                clearable
                label="Action taken"
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <DateField
                v-model="form.actionDate"
                label="Action date"
                clearable
                :disable="saving"
              />
            </div>
            <div class="col-12 col-sm-6">
              <DateField
                v-model="form.followUpDate"
                label="Follow-up date"
                clearable
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.resolutionNotes"
                type="textarea"
                label="Resolution notes"
                outlined
                dense
                autogrow
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-toggle
                v-model="form.employeeAcknowledged"
                label="Employee acknowledged"
                :disable="saving"
              />
            </div>
            <div class="col-12">
              <q-input
                v-model="form.notes"
                type="textarea"
                label="Internal notes"
                outlined
                dense
                autogrow
                :disable="saving"
              />
            </div>
            <div v-if="existingAttachments.length" class="col-12 text-caption">
              <div class="text-grey-7 q-mb-xs">Existing attachments</div>
              <div class="q-gutter-xs">
                <a
                  v-for="file in existingAttachments"
                  :key="file.id"
                  class="text-primary"
                  :href="file.fileUrl || '#'"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ file.fileName }}
                </a>
              </div>
            </div>
            <div class="col-12">
              <q-file
                v-model="attachments"
                label="Attachments"
                outlined
                dense
                multiple
                clearable
                use-chips
                counter
                max-files="10"
                :accept="EMPLOYEE_DOCUMENT_ACCEPT"
                :disable="saving"
                hint="Optional. Up to 10 files, 20 MB each."
              >
                <template #prepend>
                  <q-icon name="attach_file" />
                </template>
              </q-file>
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" v-close-popup />
        <q-btn
          type="submit"
          form="employee-incident-form"
          color="primary"
          :loading="saving"
          :label="isEdit ? 'Update' : 'Save'"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import WorksiteSelect from '@hr/components/worksite/WorksiteSelect.vue';
import { EMPLOYEE_DOCUMENT_ACCEPT } from '@hr/components/employee/document/employee-document-form';
import {
  INCIDENT_ACTION_OPTIONS,
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  INCIDENT_TYPE_OPTIONS,
  useEmployeeIncidentStore,
} from '@hr/stores/employee-incident-store';
import type { EmployeeIncident, EmployeeIncidentAttachment } from '@core/types/models';

const props = defineProps<{
  employeeId: string;
  mode: 'create' | 'edit';
}>();

const emit = defineEmits<{ saved: [] }>();

const $q = useQuasar();
const store = useEmployeeIncidentStore();
const saving = ref(false);
const attachments = ref<File[]>([]);

const today = () => new Date().toISOString().slice(0, 10);

const form = reactive({
  incidentDate: today(),
  reportedDate: today() as string | null,
  incidentType: 'MISCONDUCT',
  severity: 'MEDIUM',
  title: '',
  description: '',
  status: 'REPORTED',
  departmentId: null as number | null,
  worksiteId: null as number | null,
  actionTaken: null as string | null,
  actionDate: null as string | null,
  followUpDate: null as string | null,
  resolutionNotes: '',
  employeeAcknowledged: false,
  notes: '',
});

const isEdit = computed(() => props.mode === 'edit');

const isOpen = computed({
  get: () => (isEdit.value ? store.recordToEdit != null : store.isCreateOpen),
  set: (value) => {
    if (isEdit.value) {
      if (!value) store.setRecordToEdit(null);
      return;
    }
    store.isCreateOpen = value;
  },
});

const existingAttachments = computed((): EmployeeIncidentAttachment[] => {
  return store.recordToEdit?.attachments ?? [];
});

function resetForm() {
  form.incidentDate = today();
  form.reportedDate = today();
  form.incidentType = 'MISCONDUCT';
  form.severity = 'MEDIUM';
  form.title = '';
  form.description = '';
  form.status = 'REPORTED';
  form.departmentId = null;
  form.worksiteId = null;
  form.actionTaken = null;
  form.actionDate = null;
  form.followUpDate = null;
  form.resolutionNotes = '';
  form.employeeAcknowledged = false;
  form.notes = '';
  attachments.value = [];
}

function loadRecord(record: EmployeeIncident) {
  form.incidentDate = record.incidentDate;
  form.reportedDate = record.reportedDate ?? null;
  form.incidentType = record.incidentType;
  form.severity = record.severity;
  form.title = record.title;
  form.description = record.description ?? '';
  form.status = record.status;
  form.departmentId = record.departmentId ?? null;
  form.worksiteId = record.worksiteId ?? null;
  form.actionTaken = record.actionTaken ?? null;
  form.actionDate = record.actionDate ?? null;
  form.followUpDate = record.followUpDate ?? null;
  form.resolutionNotes = record.resolutionNotes ?? '';
  form.employeeAcknowledged = Boolean(record.employeeAcknowledged);
  form.notes = record.notes ?? '';
  attachments.value = [];
}

function onHide() {
  if (isEdit.value) {
    store.setRecordToEdit(null);
  } else {
    store.closeCreateDialog();
  }
  resetForm();
}

async function save() {
  if (!form.incidentDate || !form.incidentType || !form.severity || !form.title.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Complete the required fields.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      incidentDate: form.incidentDate,
      reportedDate: form.reportedDate || null,
      incidentType: form.incidentType,
      severity: form.severity,
      title: form.title.trim(),
      description: form.description.trim() || null,
      status: form.status,
      departmentId: form.departmentId,
      worksiteId: form.worksiteId,
      actionTaken: form.actionTaken,
      actionDate: form.actionDate || null,
      followUpDate: form.followUpDate || null,
      resolutionNotes: form.resolutionNotes.trim() || null,
      employeeAcknowledged: form.employeeAcknowledged,
      notes: form.notes.trim() || null,
    };

    const files = Array.isArray(attachments.value)
      ? attachments.value
      : attachments.value
        ? [attachments.value]
        : [];

    if (isEdit.value && store.recordToEdit) {
      await store.updateRecord(store.recordToEdit.id, payload, files);
      $q.notify({ color: 'positive', position: 'top', message: 'Incident updated.' });
    } else {
      await store.createRecord(payload, files);
      $q.notify({ color: 'positive', position: 'top', message: 'Incident saved.' });
    }

    emit('saved');
    isOpen.value = false;
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}

watch(
  () => store.recordToEdit,
  (record) => {
    if (props.mode === 'edit' && record) {
      loadRecord(record);
    }
  },
);

watch(
  () => store.isCreateOpen,
  (open) => {
    if (props.mode === 'create' && open) {
      resetForm();
    }
  },
);
</script>
