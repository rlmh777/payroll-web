<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div class="text-h6">{{ template?.id ? 'Edit pipeline template' : 'New pipeline template' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <div class="row q-col-gutter-md">
            <div class="col-12 col-md-6">
              <q-input v-model="form.name" label="Name" outlined dense :rules="[required]" />
            </div>
            <div class="col-12 col-md-6">
              <q-input
                v-model="form.key"
                label="Key"
                outlined
                dense
                hint="Stable identifier, e.g. leave_approval"
                :rules="[required]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-select
                v-model="form.subjectType"
                :options="store.meta.subjectTypes"
                label="Subject type"
                outlined
                dense
                emit-value
                map-options
                :rules="[required]"
              />
            </div>
            <div class="col-12 col-md-6">
              <q-toggle v-model="form.isActive" label="Active" />
            </div>
            <div class="col-12">
              <q-input v-model="form.description" label="Description" outlined dense type="textarea" autogrow />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.completionStatus" label="Completion status" outlined dense />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.rejectionStatus" label="Rejection status" outlined dense />
            </div>
            <div class="col-12 col-md-4">
              <q-input v-model="form.cancellationStatus" label="Cancellation status" outlined dense />
            </div>
          </div>

          <q-separator />

          <div class="row items-center justify-between">
            <div class="text-subtitle1 text-weight-medium">Steps</div>
            <q-btn flat dense color="primary" icon="add" label="Add step" @click="addStep" />
          </div>

          <div
            v-for="(step, index) in form.steps"
            :key="`${step.key}-${index}`"
            class="pipeline-step q-pa-md"
          >
            <div class="row items-center justify-between q-mb-sm">
              <div class="text-weight-medium">Step {{ index + 1 }}</div>
              <q-btn
                flat
                dense
                round
                color="negative"
                icon="delete"
                :disable="form.steps.length <= 1"
                @click="removeStep(index)"
              />
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-md-4">
                <q-input v-model="step.label" label="Label" outlined dense :rules="[required]" />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="step.key" label="Key" outlined dense :rules="[required]" />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="step.assigneeType"
                  :options="store.meta.assigneeTypes"
                  label="Assignee"
                  outlined
                  dense
                  emit-value
                  map-options
                  :rules="[required]"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-input v-model="step.domainStatus" label="Domain status" outlined dense />
              </div>
              <div class="col-12 col-md-4">
                <q-input
                  v-model="step.assigneeRole"
                  label="Assignee role"
                  outlined
                  dense
                  :disable="step.assigneeType !== 'role'"
                />
              </div>
              <div class="col-12 col-md-4">
                <q-select
                  v-model="step.actions"
                  :options="store.meta.actions"
                  label="Actions"
                  outlined
                  dense
                  multiple
                  emit-value
                  map-options
                  use-chips
                />
              </div>
            </div>
          </div>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" @click="$emit('update:modelValue', false)" />
        <q-btn color="primary" label="Save" :loading="saving" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import {
  usePipelineTemplateStore,
  type PipelineStepDraft,
  type PipelineTemplate,
} from '@workflow/stores/pipeline-template-store';

const props = defineProps<{
  modelValue: boolean;
  template?: PipelineTemplate | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = usePipelineTemplateStore();
const saving = ref(false);

const form = reactive({
  key: '',
  name: '',
  subjectType: 'leave_request',
  description: '',
  completionStatus: '',
  rejectionStatus: '',
  cancellationStatus: '',
  isActive: true,
  steps: [] as PipelineStepDraft[],
});

const required = (value: string | null | undefined) => !!String(value || '').trim() || 'Required';

function blankStep(order: number): PipelineStepDraft {
  return {
    key: `step_${order}`,
    label: `Step ${order}`,
    sortOrder: order,
    assigneeType: 'supervisor',
    assigneeRole: null,
    domainStatus: '',
    actions: ['approve', 'reject'],
    uiConfig: { mode: 'review' },
  };
}

watch(
  () => [props.modelValue, props.template] as const,
  async () => {
    if (!props.modelValue) {
      return;
    }

    if (!store.meta.subjectTypes.length) {
      await store.fetchMeta();
    }

    form.key = props.template?.key ?? '';
    form.name = props.template?.name ?? '';
    form.subjectType = props.template?.subjectType ?? store.meta.subjectTypes[0]?.value ?? 'leave_request';
    form.description = props.template?.description ?? '';
    form.completionStatus = props.template?.completionStatus ?? '';
    form.rejectionStatus = props.template?.rejectionStatus ?? '';
    form.cancellationStatus = props.template?.cancellationStatus ?? '';
    form.isActive = props.template?.isActive ?? true;
    form.steps = (props.template?.steps?.length
      ? props.template.steps.map((step, index): PipelineStepDraft => ({
          id: step.id ?? null,
          key: step.key,
          label: step.label,
          sortOrder: step.sortOrder ?? index + 1,
          assigneeType: step.assigneeType,
          assigneeRole: step.assigneeRole ?? null,
          domainStatus: step.domainStatus ?? '',
          actions: [...(step.actions?.length ? step.actions : ['approve', 'reject'])],
          uiConfig: step.uiConfig ?? { mode: 'review' },
        }))
      : [blankStep(1)]);
  },
  { immediate: true },
);

function addStep() {
  form.steps.push(blankStep(form.steps.length + 1));
}

function removeStep(index: number) {
  if (form.steps.length <= 1) {
    return;
  }
  form.steps.splice(index, 1);
  form.steps.forEach((step, stepIndex) => {
    step.sortOrder = stepIndex + 1;
  });
}

async function save() {
  if (!form.name.trim() || !form.key.trim() || !form.subjectType || form.steps.length === 0) {
    $q.notify({ type: 'warning', message: 'Name, key, subject type, and at least one step are required.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      key: form.key.trim(),
      name: form.name.trim(),
      subjectType: form.subjectType,
      description: form.description.trim() || null,
      completionStatus: form.completionStatus.trim() || null,
      rejectionStatus: form.rejectionStatus.trim() || null,
      cancellationStatus: form.cancellationStatus.trim() || null,
      isActive: form.isActive,
      steps: form.steps.map((step, index) => ({
        id: step.id ?? null,
        key: step.key.trim(),
        label: step.label.trim(),
        sortOrder: index + 1,
        assigneeType: step.assigneeType,
        assigneeRole: step.assigneeType === 'role' ? (step.assigneeRole || null) : null,
        domainStatus: step.domainStatus?.trim() || null,
        actions: step.actions?.length ? step.actions : ['approve', 'reject'],
        uiConfig: step.uiConfig ?? { mode: 'review' },
      })),
    };

    if (props.template?.id) {
      await store.updateTemplate(props.template.id, payload);
    } else {
      await store.createTemplate(payload);
    }

    emit('saved');
    emit('update:modelValue', false);
    $q.notify({ type: 'positive', message: 'Pipeline template saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save pipeline template.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.pipeline-step {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  background: #fafafa;
}
</style>
