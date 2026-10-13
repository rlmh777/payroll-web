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
          <q-select
            ref="formSelectRef"
            :model-value="form.form_template_id"
            :options="formOptions"
            emit-value
            map-options
            outlined
            dense
            label="Appraisal form"
            @update:model-value="onFormTemplateSelect"
          >
            <template #option="scope">
              <q-item
                v-if="isNewFormOption(scope.opt)"
                clickable
                v-close-popup
                @click="openCreateForm"
              >
                <q-item-section avatar>
                  <q-icon name="add" color="primary" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-else v-bind="scope.itemProps">
                <q-item-section>
                  <q-item-label>{{ scope.opt.label }}</q-item-label>
                </q-item-section>
                <q-item-section v-if="canManageAppraisalForms" side>
                  <q-btn
                    flat
                    round
                    dense
                    icon="edit"
                    color="primary"
                    size="sm"
                    @click.stop="openEditForm(String(scope.opt.value))"
                  >
                    <q-tooltip>Update form</q-tooltip>
                  </q-btn>
                </q-item-section>
              </q-item>
            </template>
          </q-select>
          <q-select
            v-model="form.pipeline_template_id"
            :options="pipelineOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Pipeline"
            hint="Leave blank to use the default supervisor → department head → HR → accounts pipeline."
          />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" v-close-popup />
            <q-btn color="primary" type="submit" label="Start" :loading="store.isSaving" />
          </div>
        </q-form>
      </AppDialogBody>
    </AppDialogCard>
  </q-dialog>

  <FormBuilderDialog
    v-model="formBuilderOpen"
    :record="editingForm"
    default-purpose="appraisal"
    lock-purpose
    @saved="onFormSaved"
  />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import { usePermissions } from '@core/composables/usePermissions';
import FormBuilderDialog from '@hr/components/forms/FormBuilderDialog.vue';
import { useAppraisalStore } from '@hr/stores/appraisal-store';
import { useFormTemplateStore } from '@hr/stores/form-template-store';
import type { FormTemplate } from '@hr/stores/form-template-store';
import { useAuthStore } from '@core/stores/auth';

const NEW_FORM_VALUE = '__new_appraisal_form__';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  started: [id: string];
}>();

const $q = useQuasar();
const store = useAppraisalStore();
const formTemplateStore = useFormTemplateStore();
const { canAny, roles } = usePermissions();
const loadingEmployees = ref(false);
const employeeOptions = ref<Array<{ label: string; value: string }>>([]);
const formBuilderOpen = ref(false);
const editingForm = ref<FormTemplate | null>(null);
const formSelectRef = ref<{ hidePopup?: () => void } | null>(null);

const canManageAppraisalForms = computed(() => {
  if (canAny(['form-templates-crud', 'appraisals-crud'])) {
    return true;
  }

  return roles.value.some((role) => ['hr', 'admin'].includes(role.toLowerCase()));
});

const form = reactive({
  employee_id: '',
  period_label: `${new Date().getFullYear()} appraisal`,
  period_start: '',
  period_end: '',
  form_template_id: null as string | null,
  pipeline_template_id: null as string | null,
});

const formOptions = computed(() => {
  const list = (store.options?.form_templates ?? []).map((item) => ({ label: item.name, value: item.id }));
  if (canManageAppraisalForms.value) {
    list.unshift({ label: 'New appraisal form', value: NEW_FORM_VALUE });
  }
  return list;
});
const pipelineOptions = computed(() =>
  (store.options?.pipeline_templates ?? []).map((item) => ({ label: item.name, value: item.id })),
);

function isNewFormOption(option: { value?: string | number | null }) {
  return option.value === NEW_FORM_VALUE;
}

async function loadOptions() {
  try {
    const options = await store.fetchOptions();
    if (!form.form_template_id && options.form_templates[0]) {
      form.form_template_id = options.form_templates[0].id;
    }
    const defaultPipeline = options.pipeline_templates.find((item) => item.key === 'employee_appraisal');
    if (!form.pipeline_template_id && defaultPipeline) {
      form.pipeline_template_id = defaultPipeline.id;
    }
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load appraisal options.',
    });
  }
}

function onFormTemplateSelect(value: string | null) {
  if (value === NEW_FORM_VALUE) {
    openCreateForm();
    return;
  }
  form.form_template_id = value;
}

function openCreateForm() {
  if (!canManageAppraisalForms.value) {
    return;
  }
  formSelectRef.value?.hidePopup?.();
  editingForm.value = null;
  formBuilderOpen.value = true;
}

async function openEditForm(id: string) {
  if (!canManageAppraisalForms.value) {
    return;
  }
  formSelectRef.value?.hidePopup?.();
  try {
    editingForm.value = await formTemplateStore.fetchTemplate(id);
    formBuilderOpen.value = true;
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not load this appraisal form.',
    });
  }
}

async function onFormSaved(saved: FormTemplate) {
  await store.fetchOptions();
  if (saved.is_active) {
    form.form_template_id = saved.id;
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
  try {
    const created = await store.start({
      employee_id: form.employee_id,
      period_label: form.period_label,
      period_start: form.period_start || null,
      period_end: form.period_end || null,
      form_template_id: form.form_template_id,
      pipeline_template_id: form.pipeline_template_id,
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
  () => props.modelValue,
  (open) => {
    if (open) {
      void loadOptions();
      void filterEmployees('', (fn) => fn());
    }
  },
);

onMounted(() => {
  if (props.modelValue) {
    void loadOptions();
  }
});
</script>
