<template>
  <q-dialog v-model="isOpen" position="right" @hide="resetState">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">Import payroll other payments</div>
        <template #close>
          <q-btn icon="close" flat round dense v-close-popup :disable="isWorking" />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <q-banner class="bg-blue-1 text-blue-10 q-mb-md" rounded dense>
          Download a template with employees pre-filled, then upload the completed file for the selected upcoming payroll run.
        </q-banner>

        <AppDialogForm>
          <div class="col-12 col-md-7">
            <q-select
              v-model="templateSort"
              :options="templateSortOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              label="Template employee sort"
            />
          </div>
          <div class="col-12 col-md-5">
            <q-btn
              outline
              color="primary"
              icon="download"
              label="Download template"
              class="full-width"
              no-caps
              :disable="employees.length === 0"
              @click="downloadTemplate"
            />
          </div>
          <div class="col-12">
            <q-file
              v-model="importFile"
              outlined
              dense
              clearable
              label="Upload completed template (.xlsx)"
              accept=".xlsx"
              :disable="isWorking || !payrollRunId"
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
        </q-banner>

        <q-banner v-else-if="preview && preview.errorCount === 0" class="bg-green-1 text-green-10 q-mt-md" rounded>
          {{ preview.recordCount }} other payment{{ preview.recordCount === 1 ? '' : 's' }} ready to import
          ({{ formatCurrency(preview.allowanceTotal) }}).
        </q-banner>

        <q-table
          v-if="preview"
          flat
          bordered
          dense
          row-key="rowNumber"
          class="payroll-allowance-import-dialog__table q-mt-md"
          :rows="preview.rows"
          :columns="previewColumns"
          :pagination="{ rowsPerPage: 10 }"
        >
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
          label="Import other payments"
          :disable="!canImport"
          :loading="isWorking"
          @click="confirmImport"
        />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  downloadPayrollAllowanceTemplate,
  readPayrollAllowanceImportFile,
  type PayrollAllowanceImportRow,
  type PayrollAllowanceTemplateSort,
} from '@payroll/utils/payroll-allowance-import';
import type {
  PayrollAllowanceEmployeeOption,
  PayrollAllowanceImportPreview,
} from '@payroll/stores/payroll-allowance-store';

const props = defineProps<{
  modelValue: boolean;
  payrollRunId: string | null;
  employees: PayrollAllowanceEmployeeOption[];
  previewImport: (rows: PayrollAllowanceImportRow[]) => Promise<PayrollAllowanceImportPreview | null>;
  confirmImportRows: (rows: PayrollAllowanceImportRow[]) => Promise<boolean>;
  isWorking?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  imported: [];
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const templateSort = ref<PayrollAllowanceTemplateSort>('last_name');
const importFile = ref<File | null>(null);
const parseErrors = ref<string[]>([]);
const parsedRows = ref<PayrollAllowanceImportRow[]>([]);
const preview = ref<PayrollAllowanceImportPreview | null>(null);

const templateSortOptions = [
  { value: 'last_name' as const, label: 'Last name, first name' },
  { value: 'department' as const, label: 'Department, last name, first name' },
];

const previewColumns = [
  { name: 'rowNumber', label: '#', field: 'rowNumber', align: 'left' as const },
  { name: 'employeeName', label: 'Employee', field: 'employeeName', align: 'left' as const },
  { name: 'allowanceName', label: 'Other Payment', field: 'allowanceName', align: 'left' as const },
  { name: 'allowanceDate', label: 'Date', field: 'allowanceDate', align: 'left' as const },
  { name: 'amount', label: 'Amount', field: 'amount', align: 'right' as const },
  { name: 'errors', label: 'Status', field: 'errors', align: 'left' as const },
];

const canImport = computed(() => Boolean(
  props.payrollRunId
  && preview.value
  && preview.value.errorCount === 0
  && preview.value.recordCount > 0
  && parsedRows.value.length > 0,
));

const formatCurrency = (value: number | string | null | undefined) => {
  const amount = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

const downloadTemplate = () => {
  downloadPayrollAllowanceTemplate(props.employees, templateSort.value);
};

const onFileSelected = async (file: File | null) => {
  parseErrors.value = [];
  parsedRows.value = [];
  preview.value = null;

  if (!file || !props.payrollRunId) {
    return;
  }

  const result = await readPayrollAllowanceImportFile(file);
  parseErrors.value = result.errors;
  parsedRows.value = result.rows;

  if (result.rows.length === 0 && result.errors.length === 0) {
    parseErrors.value = ['No other payment rows were found. Fill in the Other Payment column for employees you want to import.'];
    return;
  }

  if (result.rows.length === 0) {
    return;
  }

  preview.value = await props.previewImport(result.rows);
  if (!preview.value) {
    parseErrors.value = ['Failed to preview import. Check the file and try again.'];
  }
};

const confirmImport = async () => {
  if (!canImport.value) {
    return;
  }

  const success = await props.confirmImportRows(parsedRows.value);
  if (!success) {
    return;
  }

  emit('imported');
  close();
};

const resetState = () => {
  importFile.value = null;
  parseErrors.value = [];
  parsedRows.value = [];
  preview.value = null;
};

const close = () => {
  isOpen.value = false;
  resetState();
};
</script>

<style scoped>
.payroll-allowance-import-dialog__table {
  width: 100%;
}
</style>
