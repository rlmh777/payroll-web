<template>
  <q-page class="q-pa-md">
    <div class="row items-center justify-between q-mb-md">
      <div class="text-h6">Import employees</div>
      <q-btn flat color="grey-8" label="Back to employees" @click="goBack" />
    </div>

    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-start no-wrap q-gutter-md">
          <q-avatar color="blue-1" text-color="primary" size="36px">1</q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Download template & upload file</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Use the Excel template, then upload a completed .xlsx file. Sheets are parsed client-side
              before commit.
            </div>

            <div class="row q-col-gutter-md items-start">
              <div class="col-12 col-md-auto">
                <q-btn
                  outline
                  color="primary"
                  icon="download"
                  label="Download template"
                  :loading="isDownloadingTemplate"
                  @click="downloadTemplate"
                />
              </div>
              <div class="col-12 col-md">
                <q-file
                  :model-value="importFile"
                  outlined
                  dense
                  label="Excel file (.xlsx)"
                  accept=".xlsx"
                  clearable
                  @update:model-value="onFileSelected"
                >
                  <template #prepend>
                    <q-icon name="upload_file" />
                  </template>
                </q-file>
              </div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <q-card v-if="importFile || parseError" flat bordered class="q-mb-md">
      <q-card-section>
        <div class="row items-start no-wrap q-gutter-md">
          <q-avatar color="blue-1" text-color="primary" size="36px">2</q-avatar>
          <div class="col">
            <div class="text-subtitle1 text-weight-medium">Review parsed sheets</div>
            <div class="text-caption text-grey-7 q-mb-md">
              Confirm row counts, then preview the Employees sheet before committing.
            </div>

            <div v-if="isParsing" class="row items-center q-gutter-sm text-grey-7 q-py-md">
              <q-spinner color="primary" size="24px" />
              <span>Parsing workbook…</span>
            </div>

            <q-banner v-else-if="parseError" class="bg-red-1 text-red-9 rounded-borders">
              {{ parseError }}
            </q-banner>

            <template v-else>
              <div class="row q-col-gutter-sm q-mb-md">
                <div
                  v-for="item in sheetCounts"
                  :key="item.label"
                  class="col-6 col-sm-4 col-md-3"
                >
                  <q-card flat bordered class="q-pa-sm">
                    <div class="text-caption text-grey-7">{{ item.label }}</div>
                    <div class="text-h6">{{ item.count }}</div>
                  </q-card>
                </div>
              </div>

              <div class="q-mb-md" style="max-width: 420px">
                <div class="text-subtitle2 q-mb-xs">Default district for new localities</div>
                <div class="text-caption text-grey-7 q-mb-sm">
                  Missing locality names from the file are created under this district.
                </div>
                <DistrictSelect
                  v-model="defaultDistrictId"
                  :rules="[requiredDistrict]"
                  show-add-new
                />
              </div>

              <div class="q-mb-md">
                <q-toggle
                  v-model="overwriteExisting"
                  color="primary"
                  label="Overwrite existing employees"
                />
                <div class="text-caption text-grey-7" style="max-width: 520px">
                  When on, rows whose employee code already exists update that employee and related
                  records (employment, compensation, banks, contacts, allowances, deductions) with
                  the imported values. When off, duplicate codes are reported as errors.
                </div>
              </div>

              <div class="text-subtitle2 q-mb-sm">Employees preview (first {{ previewLimit }} rows)</div>
              <q-table
                flat
                dense
                bordered
                :rows="previewRows"
                :columns="previewColumns"
                row-key="__rowIndex"
                :rows-per-page-options="[10, 25]"
                :pagination="{ rowsPerPage: 20 }"
              />
            </template>
          </div>
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section class="row items-center justify-between">
        <div class="text-caption text-grey-7">
          Commit sends JSON sheet arrays to the API. Profile sheets (banks, contacts, leave, SS, shares, allowances, deductions, department heads) are included when present. New localities use the default district above.
        </div>
        <q-btn
          unelevated
          color="primary"
          icon="publish"
          label="Commit import"
          :loading="isImporting"
          :disable="!canCommit"
          @click="commitImport"
        />
      </q-card-section>
    </q-card>

    <q-card v-if="importResult" flat bordered>
      <q-card-section>
        <div class="text-subtitle1 text-weight-medium q-mb-sm">Import result</div>
        <div v-if="importResultMessage" class="q-mb-md">{{ importResultMessage }}</div>

        <div v-if="resultSummaryItems.length" class="row q-col-gutter-sm q-mb-md">
          <div
            v-for="item in resultSummaryItems"
            :key="item.label"
            class="col-6 col-sm-4 col-md-3"
          >
            <q-card flat bordered class="q-pa-sm">
              <div class="text-caption text-grey-7">{{ item.label }}</div>
              <div class="text-h6">{{ item.value }}</div>
            </q-card>
          </div>
        </div>

        <q-table
          v-if="importErrors.length"
          flat
          dense
          bordered
          title="Errors"
          :rows="importErrors"
          :columns="errorColumns"
          row-key="id"
          :rows-per-page-options="[10, 25, 50]"
        />

        <div class="row justify-end q-mt-md">
          <q-btn unelevated color="primary" label="Back to employees" @click="goBack" />
        </div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { employeePath } from '@core/config/module-routes';
import type { QTableColumn } from 'quasar';
import DistrictSelect from '@core/components/shared/locality/DistrictSelect.vue';
import { useEmployeeStore } from '@hr/stores/employee-store';
import {
  emptyEmployeeImportSheets,
  employeeImportSheetCounts,
  parseEmployeeImportFile,
  toEmployeeImportPayload,
  type EmployeeImportSheets,
} from '@hr/utils/employee-import';

const PREVIEW_LIMIT = 25;

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const employeeStore = useEmployeeStore();

const importFile = ref<File | null>(null);
const sheets = ref<EmployeeImportSheets>(emptyEmployeeImportSheets());
const parseError = ref('');
const isParsing = ref(false);
const isDownloadingTemplate = ref(false);
const isImporting = ref(false);
const importResult = ref<Record<string, unknown> | null>(null);
const defaultDistrictId = ref<string | null>(null);
const overwriteExisting = ref(false);
const previewLimit = PREVIEW_LIMIT;

const requiredDistrict = (val: string | null | undefined) =>
  (val != null && String(val).trim() !== '') || 'Select a default district for new localities';

const errorColumns: QTableColumn[] = [
  { name: 'sheet', label: 'Sheet', field: 'sheet', align: 'left' },
  { name: 'row', label: 'Row', field: 'row', align: 'left' },
  { name: 'message', label: 'Message', field: 'message', align: 'left' },
];

const sheetCounts = computed(() => employeeImportSheetCounts(sheets.value));

const canCommit = computed(
  () =>
    Boolean(importFile.value)
    && !isParsing.value
    && !parseError.value
    && sheets.value.employees.length > 0
    && Boolean(defaultDistrictId.value)
    && !isImporting.value,
);

const previewRows = computed(() =>
  sheets.value.employees.slice(0, PREVIEW_LIMIT).map((row, index) => ({
    ...row,
    __rowIndex: index + 1,
  })),
);

const previewColumns = computed<QTableColumn[]>(() => {
  const preferred = ['code', 'firstName', 'lastName', 'email', 'genderName', 'paymentMethodName'];
  const keys = new Set<string>();
  sheets.value.employees.slice(0, PREVIEW_LIMIT).forEach((row) => {
    Object.keys(row).forEach((key) => keys.add(key));
  });

  const ordered = [
    ...preferred.filter((key) => keys.has(key)),
    ...[...keys].filter((key) => !preferred.includes(key)),
  ].slice(0, 10);

  return ordered.map((key) => ({
    name: key,
    label: key,
    field: key,
    align: 'left' as const,
  }));
});

const importResultMessage = computed(() => {
  const message = importResult.value?.message;
  return typeof message === 'string' ? message : '';
});

const resultSummaryItems = computed(() => {
  const result = importResult.value;
  if (!result) return [];

  const summary = (result.summary ?? result.counts ?? result.data) as Record<string, unknown> | undefined;
  if (!summary || typeof summary !== 'object' || Array.isArray(summary)) {
    return [];
  }

  return Object.entries(summary)
    .filter(([, value]) => typeof value === 'number' || typeof value === 'string')
    .map(([label, value]) => ({ label, value: String(value) }));
});

const importErrors = computed(() => {
  const result = importResult.value;
  const rawErrors = (result?.errors ?? result?.failedRows ?? []) as unknown;
  if (!Array.isArray(rawErrors)) {
    return [];
  }

  return rawErrors.map((item, index) => {
    if (typeof item === 'string') {
      return { id: index, sheet: '', row: '', message: item };
    }

    const row = item as Record<string, unknown>;
    return {
      id: index,
      sheet: asDisplayString(row.sheet ?? row.sheetName),
      row: asDisplayString(row.row ?? row.rowNumber ?? row.line),
      message: asDisplayString(row.message ?? row.error) || JSON.stringify(row),
    };
  });
});

function asDisplayString(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

function goBack() {
  void router.push(employeePath(undefined, route.path));
}

function onFileSelected(value: File | File[] | null) {
  importFile.value = Array.isArray(value) ? value[0] ?? null : value;
  importResult.value = null;
  void loadFile(importFile.value);
}

async function downloadTemplate() {
  isDownloadingTemplate.value = true;
  try {
    await employeeStore.downloadEmployeeImportTemplate();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to download template.',
    });
  } finally {
    isDownloadingTemplate.value = false;
  }
}

async function loadFile(file: File | null) {
  parseError.value = '';
  sheets.value = emptyEmployeeImportSheets();

  if (!file) {
    return;
  }

  isParsing.value = true;
  try {
    sheets.value = await parseEmployeeImportFile(file);
    if (!sheets.value.employees.length) {
      parseError.value = 'No rows found on the Employees sheet.';
    }
  } catch (error) {
    parseError.value = error instanceof Error ? error.message : 'Unable to parse this file.';
  } finally {
    isParsing.value = false;
  }
}

async function commitImport() {
  if (!canCommit.value) {
    return;
  }

  isImporting.value = true;
  importResult.value = null;

  try {
    const payload = toEmployeeImportPayload(sheets.value, {
      defaultDistrictId: defaultDistrictId.value,
      overwriteExisting: overwriteExisting.value,
    });
    const result = await employeeStore.importEmployees(payload as unknown as Record<string, unknown>);
    importResult.value = result as Record<string, unknown>;
    $q.notify({ type: 'positive', message: 'Import completed.' });
    await employeeStore.fetchEmployees(true);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Import failed.',
    });
  } finally {
    isImporting.value = false;
  }
}
</script>
