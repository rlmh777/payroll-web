<template>
  <q-card flat bordered class="attendance-import-card q-mb-md">
    <q-card-section>
      <div class="row items-start no-wrap q-gutter-md">
        <q-avatar color="blue-1" text-color="primary" size="36px">1</q-avatar>
        <div>
          <div class="text-subtitle1 text-weight-medium">Select source file</div>
          <div class="text-caption text-grey-7">
            Upload a CSV or XLSX export. Recognized punch-in and punch-out columns are normalized into individual
            clocking events.
          </div>
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-md items-start">
        <div class="col-12 col-md-6">
          <q-file
            :model-value="props.importFile"
            outlined
            dense
            label="CSV or XLSX file"
            hint="Supported formats: .csv, .txt, .xlsx"
            accept=".csv,.txt,.xlsx"
            clearable
            @update:model-value="updateImportFile"
          >
            <template #prepend>
              <q-icon name="upload_file" />
            </template>
          </q-file>
        </div>
        <div class="col-12 col-md-3">
          <q-input
            :model-value="props.defaultDeviceId"
            outlined
            dense
            label="Default device / site ID"
            hint="Applied only when a staged row is blank."
            @update:model-value="emit('update:defaultDeviceId', String($event ?? ''))"
          />
        </div>
        <div class="col-12 col-md-3">
          <q-toggle
            :model-value="props.hasHeader"
            label="First row contains headers"
            @update:model-value="emit('update:hasHeader', Boolean($event))"
          />
          <div class="text-caption text-grey-7 q-ml-sm">Changing this resets staged edits.</div>
        </div>
      </div>
    </q-card-section>
  </q-card>

  <q-card v-if="props.importFile" flat bordered class="attendance-import-card q-mb-md">
    <q-card-section>
      <div class="row items-start justify-between q-col-gutter-md">
        <div class="row items-start no-wrap q-gutter-md col-12 col-md">
          <q-avatar color="blue-1" text-color="primary" size="36px">2</q-avatar>
          <div>
            <div class="text-subtitle1 text-weight-medium">Review and correct records</div>
            <div class="text-caption text-grey-7">
              Edit cells directly before import. Blank rows are ignored and all validation issues must be corrected.
            </div>
          </div>
        </div>
        <div class="col-12 col-md-auto row q-gutter-sm">
          <q-btn flat color="primary" icon="add" label="Add row" :disable="isPreparingPreview" @click="addRow" />
          <q-btn
            flat
            color="negative"
            icon="delete_outline"
            label="Remove selected"
            :disable="isPreparingPreview"
            @click="removeSelectedRows"
          />
          <q-btn
            flat
            color="grey-8"
            icon="restart_alt"
            label="Reset from file"
            :disable="isPreparingPreview"
            @click="resetStagingFromSource"
          />
        </div>
      </div>
    </q-card-section>

    <q-separator />

    <q-card-section>
      <div class="row q-col-gutter-md q-mb-md">
        <div v-for="item in stagingMetrics" :key="item.label" class="col-6 col-lg-3">
          <attendance-metric-card v-bind="item" />
        </div>
      </div>

      <q-banner v-if="previewError" class="bg-red-1 text-red-9 q-mb-md rounded-borders">
        {{ previewError }}
      </q-banner>

      <q-banner
        v-else-if="validation.exceedsMaximum"
        class="bg-red-1 text-red-9 q-mb-md rounded-borders"
      >
        This import contains more than {{ MAX_CLOCKING_IMPORT_ROWS }} ready records. Split the file into smaller
        batches before importing.
      </q-banner>

      <q-banner
        v-else-if="validation.issueRowCount"
        class="bg-orange-1 text-orange-10 q-mb-md rounded-borders"
      >
        Correct {{ validation.issueRowCount }} row{{ validation.issueRowCount === 1 ? '' : 's' }} with validation
        issues before importing.
      </q-banner>

      <div v-if="isPreparingPreview" class="row items-center q-gutter-sm text-grey-7 q-py-lg">
        <q-spinner color="primary" size="24px" />
        <span>Preparing editable records...</span>
      </div>

      <div
        v-show="!isPreparingPreview && !previewError"
        ref="previewContainer"
        class="preview-grid"
      />

      <div class="row items-center justify-between q-mt-md q-col-gutter-md">
        <div class="col-12 col-md text-caption text-grey-7">
          <div v-for="column in CLOCKING_IMPORT_COLUMNS" :key="column.field">
            <span class="text-weight-medium">{{ column.title }}:</span> {{ column.help }}
          </div>
        </div>
        <div class="col-12 col-md-auto">
          <q-btn
            unelevated
            color="primary"
            icon="publish"
            :label="importButtonLabel"
            :loading="props.isImportingFile"
            :disable="!canImport"
            @click="importReadyRows"
          />
        </div>
      </div>
    </q-card-section>

    <template v-if="validation.issues.length">
      <q-separator />
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Validation issues</div>
        <q-table
          flat
          dense
          bordered
          :rows="validation.issues"
          :columns="issueColumns"
          row-key="id"
          :rows-per-page-options="[10, 25, 50]"
        />
      </q-card-section>
    </template>
  </q-card>

  <q-card v-if="props.lastImportResult" flat bordered class="attendance-import-card">
    <q-card-section>
      <div class="text-subtitle1 text-weight-medium q-mb-sm">Import result</div>
      <div class="row q-col-gutter-md">
        <div v-for="item in importResultMetrics" :key="item.label" class="col-6 col-lg-3">
          <attendance-metric-card v-bind="item" />
        </div>
      </div>
      <q-table
        v-if="props.lastImportResult.failedRows.length"
        class="q-mt-md"
        flat
        dense
        bordered
        :rows="props.lastImportResult.failedRows"
        :columns="failedRowColumns"
        row-key="rowNumber"
      />
    </q-card-section>
  </q-card>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import * as XLSX from 'xlsx';
import jspreadsheet, { type JspreadsheetInstanceElement, type WorksheetInstance } from 'jspreadsheet-ce';
import 'jspreadsheet-ce/dist/jspreadsheet.css';
import 'jsuites/dist/jsuites.css';
import type { ImportClockingResult } from '@payroll/stores/attendance-store';
import AttendanceMetricCard from './AttendanceMetricCard.vue';
import {
  CLOCKING_IMPORT_COLUMNS,
  MAX_CLOCKING_IMPORT_ROWS,
  buildClockingStagingRows,
  clockingRowsToGridData,
  gridDataToClockingRows,
  validateClockingStagingRows,
  type ClockingImportPayloadRow,
  type ClockingImportStagingRow,
} from '@hr/utils/clocking-import-staging';

const props = defineProps<{
  importFile: File | null;
  defaultDeviceId: string;
  hasHeader: boolean;
  isImportingFile: boolean;
  lastImportResult: ImportClockingResult | null;
}>();

const emit = defineEmits<{
  (event: 'update:importFile', value: File | null): void;
  (event: 'update:defaultDeviceId', value: string): void;
  (event: 'update:hasHeader', value: boolean): void;
  (event: 'import-staged-rows', value: ClockingImportPayloadRow[]): void;
}>();

const failedRowColumns = [
  { name: 'rowNumber', label: 'Row', field: 'rowNumber', align: 'left' as const },
  { name: 'error', label: 'Error', field: 'error', align: 'left' as const },
];

const issueColumns = [
  { name: 'rowNumber', label: 'Row', field: 'rowNumber', align: 'left' as const, sortable: true },
  { name: 'field', label: 'Field', field: 'field', align: 'left' as const, sortable: true },
  { name: 'message', label: 'Issue', field: 'message', align: 'left' as const },
];

const previewContainer = ref<HTMLDivElement | null>(null);
const sourceRows = ref<unknown[][]>([]);
const stagingRows = ref<ClockingImportStagingRow[]>([]);
const previewError = ref('');
const isPreparingPreview = ref(false);
let worksheetInstance: WorksheetInstance | null = null;
let previewRequestId = 0;
let isRenderingGrid = false;

const validation = computed(() => validateClockingStagingRows(stagingRows.value, props.defaultDeviceId));
const canImport = computed(
  () =>
    validation.value.validRows.length > 0 &&
    validation.value.issueRowCount === 0 &&
    !validation.value.exceedsMaximum &&
    !isPreparingPreview.value &&
    !props.isImportingFile,
);
const importButtonLabel = computed(() => `Import ${validation.value.validRows.length} records`);
const stagingMetrics = computed(() => [
  { label: 'Staged records', value: validation.value.totalRows, icon: 'table_rows', tone: 'primary' as const },
  {
    label: 'Ready to import',
    value: validation.value.validRows.length,
    icon: 'task_alt',
    tone: 'positive' as const,
  },
  {
    label: 'Rows with issues',
    value: validation.value.issueRowCount,
    icon: 'warning_amber',
    tone: validation.value.issueRowCount ? ('warning' as const) : ('neutral' as const),
  },
  { label: 'Blank rows ignored', value: validation.value.blankRows, icon: 'remove', tone: 'neutral' as const },
]);
const importResultMetrics = computed(() => {
  if (!props.lastImportResult) return [];

  return [
    { label: 'Uploaded', value: props.lastImportResult.totalUploaded, icon: 'upload_file', tone: 'primary' as const },
    { label: 'Inserted', value: props.lastImportResult.inserted, icon: 'add_task', tone: 'positive' as const },
    {
      label: 'Duplicates skipped',
      value: props.lastImportResult.duplicatesSkipped,
      icon: 'content_copy',
      tone: 'neutral' as const,
    },
    {
      label: 'Failed rows',
      value: props.lastImportResult.failedRows.length,
      icon: 'error_outline',
      tone: props.lastImportResult.failedRows.length ? ('negative' as const) : ('neutral' as const),
    },
  ];
});

function updateImportFile(value: File | File[] | null) {
  emit('update:importFile', Array.isArray(value) ? value[0] ?? null : value ?? null);
}

function destroyPreviewSpreadsheet() {
  worksheetInstance = null;

  if (!previewContainer.value) {
    return;
  }

  try {
    jspreadsheet.destroy(previewContainer.value as JspreadsheetInstanceElement, true);
  } catch {
    // The container may not have a mounted spreadsheet yet.
  }

  previewContainer.value.innerHTML = '';
}

function syncStagingRows(instance: WorksheetInstance | null = worksheetInstance) {
  if (!instance || isRenderingGrid) {
    return;
  }

  stagingRows.value = gridDataToClockingRows(instance.getData());
}

async function renderPreviewGrid() {
  await nextTick();

  if (!previewContainer.value || previewError.value) {
    return;
  }

  isRenderingGrid = true;
  destroyPreviewSpreadsheet();

  const gridRows = clockingRowsToGridData(stagingRows.value);
  const initialRows = gridRows.length ? gridRows : [['', '', '', '']];
  const instances = jspreadsheet(previewContainer.value, {
    about: false,
    allowExport: false,
    onchange: (instance) => syncStagingRows(instance),
    oninsertrow: (instance) => syncStagingRows(instance),
    ondeleterow: (instance) => syncStagingRows(instance),
    worksheets: [
      {
        data: initialRows,
        columns: CLOCKING_IMPORT_COLUMNS.map((column) => ({
          name: column.field,
          title: column.title,
          type: column.field === 'punchType' ? ('dropdown' as const) : ('text' as const),
          source: column.field === 'punchType' ? ['', 'IN', 'OUT'] : undefined,
          width: column.width,
        })),
        editable: true,
        allowDeleteColumn: false,
        allowDeleteRow: true,
        allowDeletingAllRows: true,
        allowInsertColumn: false,
        allowInsertRow: true,
        allowManualInsertColumn: false,
        allowManualInsertRow: true,
        allowRenameColumn: false,
        columnDrag: false,
        columnSorting: false,
        rowDrag: false,
        tableOverflow: true,
        tableHeight: '420px',
        tableWidth: '100%',
        wordWrap: false,
        minDimensions: [CLOCKING_IMPORT_COLUMNS.length, Math.max(initialRows.length, 1)],
      },
    ],
  });

  worksheetInstance = instances[0] ?? null;
  isRenderingGrid = false;
}

async function resetStagingFromSource() {
  stagingRows.value = buildClockingStagingRows(sourceRows.value, props.hasHeader);
  await renderPreviewGrid();
}

function addRow() {
  if (!worksheetInstance) {
    stagingRows.value.push({
      biometricUserId: '',
      deviceId: '',
      punchDateTime: '',
      punchType: '',
    });
    void renderPreviewGrid();
    return;
  }

  worksheetInstance.insertRow(['', '', '', '']);
}

function removeSelectedRows() {
  if (!worksheetInstance) {
    return;
  }

  const selectedRows = worksheetInstance.getSelectedRows().sort((left: number, right: number) => right - left);
  selectedRows.forEach((rowIndex: number) => worksheetInstance?.deleteRow(rowIndex, 1));
  syncStagingRows();
}

function importReadyRows() {
  if (!canImport.value) {
    return;
  }

  emit('import-staged-rows', validation.value.validRows);
}

function clearPreviewState() {
  sourceRows.value = [];
  stagingRows.value = [];
  previewError.value = '';
  destroyPreviewSpreadsheet();
}

async function loadFilePreview(file: File | null) {
  const requestId = ++previewRequestId;
  previewError.value = '';

  if (!file) {
    clearPreviewState();
    return;
  }

  isPreparingPreview.value = true;

  try {
    const fileBuffer = await file.arrayBuffer();
    if (requestId !== previewRequestId) {
      return;
    }

    const workbook = XLSX.read(fileBuffer, { type: 'array', cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = firstSheetName ? workbook.Sheets[firstSheetName] : undefined;

    if (!worksheet) {
      throw new Error('No worksheet was found in this file.');
    }

    sourceRows.value = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      raw: false,
      defval: '',
      blankrows: false,
    });

    if (requestId !== previewRequestId) {
      return;
    }

    await resetStagingFromSource();
  } catch (error) {
    sourceRows.value = [];
    stagingRows.value = [];
    previewError.value = error instanceof Error ? error.message : 'Unable to prepare this file.';
    destroyPreviewSpreadsheet();
  } finally {
    if (requestId === previewRequestId) {
      isPreparingPreview.value = false;
    }
  }
}

watch(
  () => props.importFile,
  (file) => {
    void loadFilePreview(file);
  },
  { immediate: true },
);

watch(
  () => props.hasHeader,
  () => {
    if (sourceRows.value.length) {
      void resetStagingFromSource();
    }
  },
);

onBeforeUnmount(() => {
  previewRequestId += 1;
  destroyPreviewSpreadsheet();
});
</script>

<style scoped>
.attendance-import-card {
  overflow: hidden;
  border-radius: 12px;
  background: #fff;
}

.preview-grid {
  max-width: 100%;
}

:deep(.preview-grid .jss_content) {
  border-color: #d9e2ec;
  border-radius: 8px;
}

:deep(.preview-grid .jss_worksheet thead td) {
  color: #52606d;
  background: #f7f9fc;
  font-weight: 700;
}
</style>
