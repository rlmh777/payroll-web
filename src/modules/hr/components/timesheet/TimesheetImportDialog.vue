<template>
  <q-dialog v-model="isOpen" position="right" @hide="resetState">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">Upload timesheet</div>
        <template #close>
          <q-btn icon="close" flat round dense v-close-popup :disable="isWorking" />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded dense>
          Download the template, fill employee code, name, date, time in, and time out.
          Leave department blank to use each employee’s department.
        </q-banner>

        <AppDialogForm>
          <div class="col-12">
            <q-btn
              outline
              color="primary"
              icon="download"
              label="Download template"
              class="full-width"
              no-caps
              :disable="isWorking"
              @click="downloadTimesheetImportTemplate"
            />
          </div>
          <div class="col-12">
            <q-file
              v-model="importFile"
              outlined
              dense
              clearable
              label="Timesheet file"
              accept=".csv,.xls,.xlsx"
              :disable="isWorking"
              @update:model-value="onFileSelected"
            >
              <template #prepend>
                <q-icon name="upload_file" />
              </template>
            </q-file>
          </div>
        </AppDialogForm>

        <q-banner v-if="parseErrors.length" class="bg-negative text-white q-mt-md" rounded>
          <div v-for="(message, index) in parseErrors" :key="index">{{ message }}</div>
        </q-banner>

        <q-banner v-else-if="serverErrorCount > 0" class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          {{ serverErrorCount }} row{{ serverErrorCount === 1 ? '' : 's' }} need attention before the timesheet can be imported.
        </q-banner>

        <q-table
          v-if="parsedRows.length"
          flat
          bordered
          dense
          row-key="rowNumber"
          class="timesheet-import-dialog__table q-mt-md"
          :rows="tableRows"
          :columns="columns"
          :pagination="{ rowsPerPage: 8 }"
        >
          <template #body-cell-when="props">
            <q-td :props="props">
              <div>{{ props.row.date }}</div>
              <div class="text-caption text-grey-7">{{ props.row.timeIn }}–{{ props.row.timeOut }}</div>
            </q-td>
          </template>
          <template #body-cell-errors="props">
            <q-td :props="props">
              <span v-if="props.row.errors.length" class="text-negative">{{ props.row.errors.join(' ') }}</span>
              <span v-else class="text-positive">Ready</span>
            </q-td>
          </template>
        </q-table>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="isWorking" @click="isOpen = false" />
        <q-btn
          unelevated
          color="primary"
          label="Import"
          :disable="parsedRows.length === 0 || parseErrors.length > 0"
          :loading="isWorking"
          @click="submitImport"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  downloadTimesheetImportTemplate,
  readTimesheetImportFile,
  type TimesheetImportRow,
} from '@hr/utils/timesheet-import';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  imported: [];
}>();

interface ResultRow extends TimesheetImportRow {
  rowNumber: number;
  errors: string[];
}

const $q = useQuasar();
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const importFile = ref<File | null>(null);
const parseErrors = ref<string[]>([]);
const parsedRows = ref<TimesheetImportRow[]>([]);
const resultRows = ref<ResultRow[]>([]);
const isWorking = ref(false);

const serverErrorCount = computed(() => resultRows.value.filter((row) => row.errors.length > 0).length);
const tableRows = computed(() => (
  resultRows.value.length > 0
    ? resultRows.value
    : parsedRows.value.map((row, index) => ({ ...row, rowNumber: index + 1, errors: [] as string[] }))
));

const columns = [
  { name: 'rowNumber', label: '#', field: 'rowNumber', align: 'left' as const },
  { name: 'employeeCode', label: 'Code', field: 'employeeCode', align: 'left' as const },
  { name: 'employeeName', label: 'Name', field: 'employeeName', align: 'left' as const },
  { name: 'departmentName', label: 'Department', field: 'departmentName', align: 'left' as const },
  { name: 'when', label: 'When', field: 'date', align: 'left' as const },
  { name: 'errors', label: 'Status', field: 'errors', align: 'left' as const },
];

function resetState() {
  importFile.value = null;
  parseErrors.value = [];
  parsedRows.value = [];
  resultRows.value = [];
  isWorking.value = false;
}

async function onFileSelected(file: File | null) {
  resultRows.value = [];
  parsedRows.value = [];
  parseErrors.value = [];
  if (!file) {
    return;
  }

  try {
    const parsed = await readTimesheetImportFile(file);
    parsedRows.value = parsed.rows;
    parseErrors.value = parsed.errors;
  } catch (error) {
    parseErrors.value = [error instanceof Error ? error.message : 'The file could not be read.'];
  }
}

async function submitImport() {
  if (parsedRows.value.length === 0 || parseErrors.value.length > 0) {
    return;
  }

  isWorking.value = true;
  try {
    const response = await fetch(`${API_URL}/timesheets/import`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rows: parsedRows.value }),
    });
    const body = await response.json().catch(() => ({})) as {
      message?: string;
      rows?: ResultRow[];
    };

    if (!response.ok) {
      resultRows.value = Array.isArray(body.rows) ? body.rows : [];
      $q.notify({
        type: 'warning',
        message: body.message || 'The timesheet file needs corrections.',
        position: 'top',
      });
      return;
    }

    $q.notify({
      type: 'positive',
      message: body.message || 'Timesheet imported.',
      position: 'top',
    });
    emit('imported');
    isOpen.value = false;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Timesheet import failed.',
      position: 'top',
    });
  } finally {
    isWorking.value = false;
  }
}
</script>

<style scoped>
.timesheet-import-dialog__table {
  max-width: 720px;
}
</style>
