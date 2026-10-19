<template>
  <q-dialog :model-value="modelValue" position="right" @update:model-value="emit('update:modelValue', $event)">
    <AppDialogCard>
      <AppDialogHeader>
        Start appraisal
        <template #close>
          <q-btn icon="close" flat round dense v-close-popup />
        </template>
      </AppDialogHeader>
      <AppDialogBody>
        <q-form class="q-gutter-md" @submit.prevent="submit">
          <q-select
            v-if="reportsOnly"
            v-model="form.employee_id"
            :options="reportOptions"
            emit-value
            map-options
            outlined
            dense
            label="Employee"
            :loading="loadingReports"
          />
          <q-select
            v-else
            v-model="form.employee_id"
            :options="employeeOptions"
            emit-value
            map-options
            use-input
            outlined
            dense
            label="Employee"
            :loading="loadingEmployees"
            @filter="filterEmployees"
          />
          <q-input v-model="form.period_label" outlined dense label="Period" />
          <div class="row q-col-gutter-sm">
            <div class="col-6">
              <q-input v-model="form.period_start" outlined dense type="date" label="From" />
            </div>
            <div class="col-6">
              <q-input v-model="form.period_end" outlined dense type="date" label="To" />
            </div>
          </div>
          <q-input
            :model-value="selectedFormName"
            outlined
            dense
            readonly
            label="Appraisal form"
            hint="The form is taken from the employee’s active contract."
          />
          <div v-if="form.employee_id && !selectedFormName" class="text-negative">
            Set an appraisal form on this employee’s contract before starting a review.
          </div>
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn
              color="primary"
              type="submit"
              label="Start"
              :loading="store.isSaving"
              :disable="!selectedFormName"
            />
          </div>
        </q-form>
      </AppDialogBody>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import { useAppraisalStore } from '@hr/stores/appraisal-store';
import { useAuthStore } from '@core/stores/auth';

interface ReportOption {
  id: string;
  code?: string | null;
  name: string;
  appraisal_form?: { id: string; name: string } | null;
}

const props = defineProps<{
  modelValue: boolean;
  reportsOnly?: boolean;
}>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  started: [id: string];
}>();

const $q = useQuasar();
const store = useAppraisalStore();
const loadingEmployees = ref(false);
const loadingReports = ref(false);
const employeeOptions = ref<Array<{ label: string; value: string }>>([]);
const reports = ref<ReportOption[]>([]);
const selectedContract = ref<ReportOption | undefined>();

const form = reactive({
  employee_id: '',
  period_label: `${new Date().getFullYear()} appraisal`,
  period_start: '',
  period_end: '',
});

const reportOptions = computed(() =>
  reports.value.map((row) => ({
    value: row.id,
    label: row.code ? `${row.name} (${row.code})` : row.name,
  })),
);

const selectedFormName = computed(() => {
  if (props.reportsOnly) {
    return reports.value.find((row) => row.id === form.employee_id)?.appraisal_form?.name ?? '';
  }
  return selectedContract.value?.id === form.employee_id
    ? selectedContract.value.appraisal_form?.name ?? ''
    : '';
});

async function loadReports() {
  loadingReports.value = true;
  try {
    reports.value = await store.fetchCandidates();
  } catch (error) {
    reports.value = [];
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load employees.',
    });
  } finally {
    loadingReports.value = false;
  }
}

async function loadContract(employeeId: string) {
  if (!employeeId || props.reportsOnly) {
    selectedContract.value = undefined;
    return;
  }
  try {
    selectedContract.value = await store.fetchContract(employeeId);
  } catch (error) {
    selectedContract.value = undefined;
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load this employee’s contract.',
    });
  }
}

async function filterEmployees(value: string, update: (fn: () => void) => void) {
  loadingEmployees.value = true;
  try {
    const authStore = useAuthStore();
    const params = new URLSearchParams();
    if (value) params.set('search', value);
    params.set('per_page', '30');
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/employees?${params}`, {
      headers: {
        Accept: 'application/json',
        ...(authStore.token ? { Authorization: `Bearer ${authStore.token}` } : {}),
      },
    });
    const body = await response.json().catch(() => ({}));
    const rows = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
    update(() => {
      employeeOptions.value = rows.map((row: { id: string; firstName?: string; lastName?: string; code?: string }) => ({
        value: row.id,
        label: `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim() + (row.code ? ` (${row.code})` : ''),
      }));
    });
  } finally {
    loadingEmployees.value = false;
  }
}

async function submit() {
  if (!form.employee_id) {
    $q.notify({ type: 'negative', message: 'Select an employee.' });
    return;
  }
  if (!selectedFormName.value) {
    $q.notify({ type: 'negative', message: 'Set an appraisal form on the employee’s contract first.' });
    return;
  }
  try {
    const created = await store.start({
      employee_id: form.employee_id,
      period_label: form.period_label,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
    });
    $q.notify({ type: 'positive', message: 'Appraisal started.' });
    emit('update:modelValue', false);
    emit('started', created.id);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not start the appraisal.',
    });
  }
}

watch(
  () => form.employee_id,
  (employeeId) => {
    void loadContract(employeeId);
  },
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) {
      return;
    }
    form.employee_id = '';
    selectedContract.value = undefined;
    if (props.reportsOnly) {
      void loadReports();
    } else {
      void filterEmployees('', (fn) => fn());
    }
  },
);
</script>
