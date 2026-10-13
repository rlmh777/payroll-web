<template>
  <q-dialog
    :model-value="modelValue"
    position="right"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AppDialogCard class="form-assignment-card">
      <AppDialogHeader>
        <div class="text-h6">Distribute {{ template?.name }}</div>
      </AppDialogHeader>
      <AppDialogBody>
        <div class="q-mb-md">
          <div class="row items-center q-mb-sm">
            <div class="text-subtitle2">Assignments</div>
            <q-space />
            <q-btn
              v-if="editing"
              flat
              dense
              no-caps
              label="New assignment"
              @click="startCreate"
            />
          </div>
          <q-list v-if="store.assignments.length" bordered separator class="rounded-borders">
            <q-item v-for="row in store.assignments" :key="row.id" clickable @click="edit(row)">
              <q-item-section>
                <q-item-label>{{ row.name || template?.name }}</q-item-label>
                <q-item-label caption>{{ audienceLabel(row) }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="row.is_active ? 'positive' : 'grey'">
                  {{ row.is_active ? 'Active' : 'Inactive' }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey-7">No assignments yet.</div>
        </div>

        <q-separator class="q-mb-md" />
        <div class="text-subtitle2 q-mb-sm">{{ editing ? 'Edit assignment' : 'New assignment' }}</div>
        <AppDialogForm>
          <div class="col-12">
            <q-input v-model="form.name" outlined dense label="Name (optional)" />
          </div>
          <div class="col-12">
            <q-select
              v-model="form.audience_type"
              outlined
              dense
              emit-value
              map-options
              label="Audience"
              :options="audienceOptions"
            />
          </div>
          <div v-if="form.audience_type === 'departments'" class="col-12">
            <q-select
              v-model="form.department_ids"
              outlined
              dense
              multiple
              use-chips
              emit-value
              map-options
              label="Departments"
              :options="departmentOptions"
            />
          </div>
          <div v-if="form.audience_type === 'employee_groups'" class="col-12">
            <q-select
              v-model="form.employee_group_ids"
              outlined
              dense
              multiple
              use-chips
              emit-value
              map-options
              label="Employee groups"
              :options="groupOptions"
            />
          </div>
          <div v-if="form.audience_type === 'employees'" class="col-12">
            <q-select
              v-model="form.employee_ids"
              outlined
              dense
              multiple
              use-chips
              use-input
              emit-value
              map-options
              label="Employees"
              :options="employeeOptions"
              @filter="filterEmployees"
            />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="form.starts_at" outlined dense type="datetime-local" label="Opens" />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="form.ends_at" outlined dense type="datetime-local" label="Closes" />
          </div>
          <div class="col-12">
            <q-select
              v-model="form.pipeline_template_id"
              outlined
              dense
              clearable
              emit-value
              map-options
              label="Review pipeline (optional)"
              :options="pipelineOptions"
            />
          </div>
          <div class="col-12">
            <q-toggle v-model="form.show_on_login" label="Show on login if not filled" />
          </div>
          <div class="col-12">
            <q-toggle v-model="form.is_required" label="Required (block the app until submitted)" />
          </div>
          <div class="col-12">
            <q-toggle v-model="form.is_active" label="Active" />
          </div>
        </AppDialogForm>
      </AppDialogBody>
      <AppDialogActions>
        <q-btn v-if="editing" flat color="negative" label="Delete" @click="remove" />
        <q-space />
        <q-btn v-close-popup flat label="Close" />
        <q-btn color="primary" :loading="store.isSaving" label="Save assignment" @click="void save()" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { useDepartmentStore } from '@hr/stores/department-store';
import { useEmployeeGroupStore } from '@hr/stores/employee-group-store';
import {
  useFormAssignmentStore,
  type FormAssignment,
  type FormAudienceType,
} from '@hr/stores/form-assignment-store';
import type { FormTemplate } from '@hr/stores/form-template-store';
import { useAuthStore } from '@core/stores/auth';

const props = defineProps<{
  modelValue: boolean;
  template?: FormTemplate | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const store = useFormAssignmentStore();
const departmentStore = useDepartmentStore();
const groupStore = useEmployeeGroupStore();
const $q = useQuasar();
const editing = ref<FormAssignment | null>(null);
const employeeOptions = ref<Array<{ label: string; value: string }>>([]);
const pipelineOptions = ref<Array<{ label: string; value: string }>>([]);

const audienceOptions = [
  { label: 'Entire company', value: 'company' },
  { label: 'Departments', value: 'departments' },
  { label: 'Employee groups', value: 'employee_groups' },
  { label: 'Specific employees', value: 'employees' },
];

const form = reactive({
  name: '',
  audience_type: 'company' as FormAudienceType,
  department_ids: [] as number[],
  employee_group_ids: [] as string[],
  employee_ids: [] as string[],
  starts_at: '',
  ends_at: '',
  pipeline_template_id: null as string | null,
  show_on_login: true,
  is_required: true,
  is_active: true,
});

const departmentOptions = computed(() =>
  departmentStore.departmentOptions.map((item) => ({ label: item.name, value: item.id })),
);
const groupOptions = computed(() =>
  groupStore.groups.map((item) => ({ label: item.name, value: item.id })),
);

function toLocalInput(value?: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function startCreate() {
  editing.value = null;
  form.name = '';
  form.audience_type = 'company';
  form.department_ids = [];
  form.employee_group_ids = [];
  form.employee_ids = [];
  form.starts_at = '';
  form.ends_at = '';
  form.pipeline_template_id = null;
  form.show_on_login = true;
  form.is_required = true;
  form.is_active = true;
}

function edit(row: FormAssignment) {
  editing.value = row;
  form.name = row.name ?? '';
  form.audience_type = row.audience_type;
  form.department_ids = [...row.department_ids];
  form.employee_group_ids = [...row.employee_group_ids];
  form.employee_ids = [...row.employee_ids];
  form.starts_at = toLocalInput(row.starts_at);
  form.ends_at = toLocalInput(row.ends_at);
  form.pipeline_template_id = row.pipeline_template_id ?? null;
  form.show_on_login = row.show_on_login;
  form.is_required = row.is_required;
  form.is_active = row.is_active;
  employeeOptions.value = row.employees.map((employee) => ({
    label: `${employee.code ?? ''} ${employee.name ?? ''}`.trim(),
    value: employee.id,
  }));
}

function audienceLabel(row: FormAssignment) {
  if (row.audience_type === 'company') {
    return 'Entire company';
  }
  if (row.audience_type === 'departments') {
    return row.departments.map((item) => item.name).join(', ') || 'Departments';
  }
  if (row.audience_type === 'employee_groups') {
    return row.employee_groups.map((item) => item.name).join(', ') || 'Groups';
  }
  return `${row.employees.length} employee${row.employees.length === 1 ? '' : 's'}`;
}

async function save() {
  if (!props.template) {
    return;
  }
  try {
    await store.saveAssignment(
      props.template.id,
      {
        name: form.name.trim() || null,
        audience_type: form.audience_type,
        department_ids: form.department_ids,
        employee_group_ids: form.employee_group_ids,
        employee_ids: form.employee_ids,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
        pipeline_template_id: form.pipeline_template_id,
        show_on_login: form.show_on_login,
        is_required: form.is_required,
        is_active: form.is_active,
      },
      editing.value?.id,
    );
    $q.notify({ type: 'positive', message: 'Assignment saved.' });
    startCreate();
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save assignment.',
    });
  }
}

function remove() {
  if (!editing.value || !props.template) {
    return;
  }
  $q.dialog({
    title: 'Delete assignment?',
    message: 'People who have not submitted will no longer see this form.',
    cancel: true,
    ok: { label: 'Delete', color: 'negative' },
  }).onOk(() => {
    void store.deleteAssignment(editing.value!.id, props.template!.id).then(
      () => {
        $q.notify({ type: 'positive', message: 'Assignment deleted.' });
        startCreate();
      },
      (error: unknown) => {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Could not delete assignment.',
        });
      },
    );
  });
}

async function filterEmployees(value: string, update: (fn: () => void) => void) {
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = useAuthStore().token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const params = new URLSearchParams({ per_page: '20', search: value });
  const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/employees?${params}`, {
    headers,
  });
  const body = await response.json().catch(() => ({}));
  const rows = Array.isArray(body.data) ? body.data : [];
  update(() => {
    employeeOptions.value = rows.map((row: { id: string; code?: string; firstName?: string; lastName?: string }) => ({
      label: `${row.code ?? ''} ${row.firstName ?? ''} ${row.lastName ?? ''}`.trim(),
      value: row.id,
    }));
  });
}

async function loadPipelines() {
  const headers: HeadersInit = { Accept: 'application/json' };
  const token = useAuthStore().token;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(
    `${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/pipeline-templates?subject_type=form_response&active_only=1`,
    { headers },
  );
  if (!response.ok) {
    pipelineOptions.value = [];
    return;
  }
  const rows = await response.json();
  const list = Array.isArray(rows) ? rows : [];
  pipelineOptions.value = list.map((row: { id: string; name: string }) => ({
    label: row.name,
    value: row.id,
  }));
}

watch(
  () => [props.modelValue, props.template?.id],
  () => {
    if (props.modelValue && props.template) {
      startCreate();
      void store.fetchAssignments(props.template.id);
      void departmentStore.fetchDepartmentOptions();
      void groupStore.fetchGroups({ activeOnly: true });
      void loadPipelines();
    }
  },
);
</script>

<style scoped>
.form-assignment-card {
  width: min(560px, 96vw);
}
</style>
