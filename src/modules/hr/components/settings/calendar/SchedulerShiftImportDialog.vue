<template>
  <q-dialog v-model="isOpen" position="right" @hide="resetState">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">Import shifts</div>
        <template #close>
          <q-btn icon="close" flat round dense v-close-popup :disable="isWorking" />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded dense>
          Download a template for
          {{ companyWideLabel }}, fill future dates and times, then upload to preview on the scheduler before applying.
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
              :disable="employees.length === 0 || isWorking"
              @click="downloadTemplate"
            />
          </div>
          <div class="col-12">
            <q-file
              v-model="importFile"
              outlined
              dense
              clearable
              label="Upload Excel (.xlsx)"
              accept=".xlsx"
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

        <q-banner v-else-if="preview && preview.errorCount > 0" class="bg-orange-1 text-orange-10 q-mt-md" rounded>
          {{ preview.errorCount }} row{{ preview.errorCount === 1 ? '' : 's' }} need attention before import.
          Valid rows are shown as dashed shifts on the scheduler.
        </q-banner>

        <q-banner v-else-if="preview && preview.validCount > 0" class="bg-green-1 text-green-10 q-mt-md" rounded>
          {{ preview.validCount }} shift{{ preview.validCount === 1 ? '' : 's' }} ready to apply.
          Review the dashed preview on the scheduler, then apply.
        </q-banner>

        <q-table
          v-if="preview"
          flat
          bordered
          dense
          row-key="rowNumber"
          class="scheduler-shift-import-dialog__table q-mt-md"
          :rows="preview.rows"
          :columns="previewColumns"
          :pagination="{ rowsPerPage: 8 }"
        >
          <template #body-cell-when="props">
            <q-td :props="props">
              <div>{{ props.row.startDate }}{{ props.row.endDate && props.row.endDate !== props.row.startDate ? ` → ${props.row.endDate}` : '' }}</div>
              <div class="text-caption text-grey-7">{{ props.row.startTime }}–{{ props.row.endTime }}</div>
            </q-td>
          </template>
          <template #body-cell-errors="props">
            <q-td :props="props">
              <span v-if="props.row.errors?.length" class="text-negative">
                {{ props.row.errors.join(' ') }}
              </span>
              <span v-else class="text-positive">OK</span>
            </q-td>
          </template>
        </q-table>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="isWorking" @click="close" />
        <q-btn
          unelevated
          color="primary"
          label="Apply import"
          :disable="!canImport"
          :loading="isWorking"
          @click="confirmImport"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import type { CalendarEmployee } from '@hr/stores/calendar-store';
import {
  downloadSchedulerShiftImportTemplate,
  readSchedulerShiftImportFile,
  type SchedulerShiftImportPreview,
  type SchedulerShiftImportRow,
} from '@hr/utils/scheduler-shift-import';
import { canViewAllSchedulerEmployees } from '@hr/utils/scheduler-access';

const props = defineProps<{
  modelValue: boolean;
  employees: CalendarEmployee[];
  previewImport: (rows: SchedulerShiftImportRow[]) => Promise<SchedulerShiftImportPreview | null>;
  confirmImportRows: (rows: SchedulerShiftImportRow[]) => Promise<boolean>;
  isWorking?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  previewed: [preview: SchedulerShiftImportPreview | null];
  imported: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const importFile = ref<File | null>(null);
const parseErrors = ref<string[]>([]);
const parsedRows = ref<SchedulerShiftImportRow[]>([]);
const preview = ref<SchedulerShiftImportPreview | null>(null);

const companyWideLabel = computed(() =>
  canViewAllSchedulerEmployees()
    ? 'all employees'
    : 'employees who report to you',
);

const previewColumns = [
  { name: 'rowNumber', label: '#', field: 'rowNumber', align: 'left' as const },
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' as const },
  { name: 'when', label: 'When', field: 'startDate', align: 'left' as const },
  { name: 'description', label: 'Description', field: 'description', align: 'left' as const },
  { name: 'errors', label: 'Status', field: 'errors', align: 'left' as const },
];

const canImport = computed(() => Boolean(
  preview.value
  && preview.value.errorCount === 0
  && preview.value.validCount > 0
  && parsedRows.value.length > 0
  && !props.isWorking,
));

watch(preview, (value) => {
  emit('previewed', value);
});

function downloadTemplate() {
  downloadSchedulerShiftImportTemplate(props.employees);
}

async function onFileSelected(file: File | null) {
  parseErrors.value = [];
  parsedRows.value = [];
  preview.value = null;

  if (!file) {
    return;
  }

  const parsed = await readSchedulerShiftImportFile(file);
  if (parsed.errors.length) {
    parseErrors.value = parsed.errors;
    return;
  }

  if (parsed.rows.length === 0) {
    parseErrors.value = ['No shift rows found in the file.'];
    return;
  }

  parsedRows.value = parsed.rows;
  const result = await props.previewImport(parsed.rows);
  if (!result) {
    parseErrors.value = ['Unable to preview the import.'];
    return;
  }

  preview.value = result;
}

async function confirmImport() {
  if (!canImport.value) {
    return;
  }

  const ok = await props.confirmImportRows(parsedRows.value);
  if (!ok) {
    return;
  }

  emit('imported');
  close();
}

function close() {
  isOpen.value = false;
}

function resetState() {
  importFile.value = null;
  parseErrors.value = [];
  parsedRows.value = [];
  preview.value = null;
  emit('previewed', null);
}
</script>

<style scoped>
.scheduler-shift-import-dialog__table {
  max-width: 100%;
}
</style>
