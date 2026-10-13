<template>
  <q-dialog
    :model-value="modelValue"
    position="right"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <AppDialogCard class="form-builder-card">
      <AppDialogHeader>
        <div class="ellipsis text-subtitle1">{{ form.name.trim() || 'Untitled form' }}</div>
        <template #close>
          <q-btn
            flat
            round
            dense
            :icon="tab === 'preview' ? 'edit' : 'visibility'"
            @click="tab = tab === 'preview' ? 'build' : 'preview'"
          >
            <q-tooltip>{{ tab === 'preview' ? 'Back to editing' : 'Preview' }}</q-tooltip>
          </q-btn>
          <q-btn icon="close" flat round dense v-close-popup />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <div v-if="tab === 'preview'" class="form-builder-canvas">
          <div class="form-builder-title-card">
            <div class="form-builder-title-card__bar" />
            <div class="form-builder-title-card__body">
              <div class="form-builder-preview-title">{{ form.name.trim() || 'Untitled form' }}</div>
              <div v-if="form.description.trim()" class="form-builder-preview-desc">{{ form.description }}</div>
              <div class="text-caption text-grey-7 q-mt-sm">
                {{
                  form.purpose === 'score_sheet'
                    ? 'Score sheet'
                    : form.purpose === 'feedback'
                      ? 'Feedback form'
                      : form.purpose === 'appraisal'
                        ? 'Appraisal form'
                        : 'General form'
                }}
                <span v-if="form.purpose === 'score_sheet'"> · Required questions are marked with *</span>
              </div>
            </div>
          </div>
          <div
            v-for="field in form.schema.fields"
            :key="field.id"
            class="form-builder-question"
            :class="{ 'form-builder-question--section': field.type === 'section' }"
          >
            <FormRenderer :schema="{ fields: [field] }" v-model:answers="previewAnswers" />
          </div>
          <div v-if="!form.schema.fields.length" class="form-builder-empty">This form has no questions yet.</div>
        </div>

        <div v-else class="form-builder-canvas">
          <div
            class="form-builder-row"
            :class="{ 'form-builder-row--active': selectedId === 'title' }"
          >
            <div
              class="form-builder-title-card"
              :class="{ 'form-builder-title-card--selected': selectedId === 'title' }"
              @click="selectedId = 'title'"
            >
              <div class="form-builder-title-card__bar" />
              <div class="form-builder-title-card__body">
                <q-input
                  v-model="form.name"
                  borderless
                  class="form-builder-title-input"
                  placeholder="Untitled form"
                  :rules="[(v) => !!v?.trim() || 'Name is required']"
                  @focus="selectedId = 'title'"
                />
                <q-input
                  v-model="form.description"
                  borderless
                  autogrow
                  class="form-builder-desc-input"
                  placeholder="Form description"
                  @focus="selectedId = 'title'"
                />
                <div class="row items-center q-col-gutter-sm q-mt-sm">
                  <div v-if="!lockPurpose" class="col-12 col-sm-7">
                    <q-select
                      v-model="form.purpose"
                      outlined
                      dense
                      emit-value
                      map-options
                      label="Purpose"
                      :options="purposeOptions"
                    />
                  </div>
                  <div class="col-12" :class="lockPurpose ? 'col-sm-12' : 'col-sm-5'">
                    <q-toggle v-model="form.is_active" label="Active" />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="selectedId === 'title'" class="form-builder-toolbar">
              <q-btn flat round dense icon="add" @click="addField(defaultQuestionType())">
                <q-tooltip>Add question</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="title" @click="addField('section')">
                <q-tooltip>Add section</q-tooltip>
              </q-btn>
            </div>
          </div>

          <div
            v-for="(field, index) in form.schema.fields"
            :id="`form-field-${field.id}`"
            :key="field.id"
            class="form-builder-row"
            :class="{ 'form-builder-row--active': selectedId === field.id }"
            @dragover.prevent
            @drop.prevent="onDrop(index)"
          >
            <div
              class="form-builder-question"
              :class="{
                'form-builder-question--selected': selectedId === field.id,
                'form-builder-question--section': field.type === 'section',
                'form-builder-question--dragging': dragIndex === index,
              }"
              @click="selectedId = field.id"
            >
              <div
                class="form-builder-drag"
                draggable="true"
                @dragstart="onDragStart(index, $event)"
                @dragend="dragIndex = null"
              >
                <q-icon name="drag_indicator" />
              </div>

              <div v-if="selectedId !== field.id" class="form-builder-question__preview">
                <div class="form-builder-question__label">
                  {{ field.label || (field.type === 'section' ? 'Untitled section' : 'Untitled question') }}
                  <span v-if="field.required" class="text-negative"> *</span>
                </div>
                <div v-if="field.help" class="text-caption text-grey-7 q-mb-sm">{{ field.help }}</div>
                <div v-if="field.type === 'text'" class="form-builder-fake-input">Short answer text</div>
                <div v-else-if="field.type === 'textarea'" class="form-builder-fake-input form-builder-fake-input--long">
                  Long answer text
                </div>
                <div v-else-if="field.type === 'number' || field.type === 'score'" class="form-builder-fake-input">
                  {{ field.type === 'score' ? 'Score' : 'Number' }}
                  <span v-if="field.max != null"> (max {{ field.max }})</span>
                </div>
                <div v-else-if="field.type === 'date'" class="form-builder-fake-input">Month, day, year</div>
                <div v-else-if="field.type === 'checkbox'" class="row items-center text-grey-7">
                  <q-icon name="check_box_outline_blank" class="q-mr-sm" />
                  Yes / No
                </div>
                <div v-else-if="field.type === 'select'" class="form-builder-fake-select">Choose</div>
                <div v-else-if="field.type === 'radio'" class="form-builder-options-preview">
                  <div v-for="option in field.options" :key="option.value" class="row items-center q-mb-xs text-grey-8">
                    <q-icon name="radio_button_unchecked" class="q-mr-sm" />
                    {{ option.label }}
                  </div>
                </div>
              </div>

              <div v-else class="form-builder-question__edit" @click.stop>
                <div class="row items-start q-col-gutter-md">
                  <div class="col">
                    <q-input
                      v-model="field.label"
                      filled
                      dense
                      :placeholder="field.type === 'section' ? 'Section title' : 'Question'"
                    />
                  </div>
                  <div v-if="field.type !== 'section'" class="col-12 col-sm-5">
                    <q-select
                      v-model="field.type"
                      outlined
                      dense
                      emit-value
                      map-options
                      :options="questionTypeOptions"
                      @update:model-value="onTypeChange(field, $event)"
                    >
                      <template #option="scope">
                        <q-item v-bind="scope.itemProps">
                          <q-item-section avatar>
                            <q-icon :name="scope.opt.icon" />
                          </q-item-section>
                          <q-item-section>{{ scope.opt.label }}</q-item-section>
                        </q-item>
                      </template>
                      <template #selected>
                        <div class="row items-center no-wrap">
                          <q-icon :name="typeMeta(field.type)?.icon" class="q-mr-sm" />
                          <span>{{ typeMeta(field.type)?.label }}</span>
                        </div>
                      </template>
                    </q-select>
                  </div>
                </div>

                <q-input
                  v-if="field.type !== 'section'"
                  v-model="field.help"
                  borderless
                  dense
                  class="form-builder-desc-input q-mt-sm"
                  placeholder="Description (optional)"
                />

                <div v-if="field.type === 'text'" class="form-builder-fake-input q-mt-md">Short answer text</div>
                <div v-else-if="field.type === 'textarea'" class="form-builder-fake-input form-builder-fake-input--long q-mt-md">
                  Long answer text
                </div>
                <div v-else-if="field.type === 'date'" class="form-builder-fake-input q-mt-md">Month, day, year</div>
                <div v-else-if="field.type === 'checkbox'" class="row items-center text-grey-7 q-mt-md">
                  <q-icon name="check_box_outline_blank" class="q-mr-sm" />
                  Yes / No
                </div>
                <div v-else-if="field.type === 'number' || field.type === 'score'" class="row q-col-gutter-sm q-mt-md">
                  <div v-if="field.type === 'score' || field.type === 'number'" class="col-4">
                    <q-input v-model.number="field.min" outlined dense type="number" label="Min" />
                  </div>
                  <div class="col-4">
                    <q-input v-model.number="field.max" outlined dense type="number" label="Max" />
                  </div>
                  <div v-if="field.type === 'score'" class="col-4">
                    <q-input v-model.number="field.weight" outlined dense type="number" min="0" label="Weight" />
                  </div>
                </div>
                <div v-else-if="field.type === 'select' || field.type === 'radio'" class="q-mt-md">
                  <div v-for="(option, optionIndex) in field.options ?? []" :key="optionIndex" class="form-builder-option">
                    <q-icon :name="field.type === 'radio' ? 'radio_button_unchecked' : 'drag_handle'" class="text-grey-6" />
                    <q-input v-model="option.label" borderless dense class="col" placeholder="Option" />
                    <q-btn
                      flat
                      round
                      dense
                      icon="close"
                      :disable="(field.options?.length ?? 0) <= 1"
                      @click="removeOption(field, optionIndex)"
                    />
                  </div>
                  <q-btn
                    flat
                    dense
                    no-caps
                    color="primary"
                    icon="add"
                    label="Add option"
                    @click="addOption(field)"
                  />
                </div>

                <div v-if="field.type !== 'section'" class="form-builder-question__footer">
                  <q-btn flat round dense icon="content_copy" @click="duplicateField(index)">
                    <q-tooltip>Duplicate</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="delete" @click="removeField(index)">
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                  <q-separator vertical inset class="q-mx-sm" />
                  <q-toggle v-model="field.required" label="Required" />
                </div>
                <div v-else class="form-builder-question__footer">
                  <q-btn flat round dense icon="content_copy" @click="duplicateField(index)">
                    <q-tooltip>Duplicate</q-tooltip>
                  </q-btn>
                  <q-btn flat round dense icon="delete" @click="removeField(index)">
                    <q-tooltip>Delete</q-tooltip>
                  </q-btn>
                </div>
              </div>
            </div>

            <div v-if="selectedId === field.id" class="form-builder-toolbar">
              <q-btn flat round dense icon="add" @click="addField(defaultQuestionType())">
                <q-tooltip>Add question</q-tooltip>
              </q-btn>
              <q-btn flat round dense icon="title" @click="addField('section')">
                <q-tooltip>Add section</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn v-close-popup flat label="Cancel" />
        <q-btn color="primary" :loading="store.isSaving" label="Save" @click="void save()" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import FormRenderer from '@hr/components/forms/FormRenderer.vue';
import {
  FIELD_TYPE_OPTIONS,
  emptyField,
  useFormTemplateStore,
  type FormField,
  type FormFieldType,
  type FormTemplate,
} from '@hr/stores/form-template-store';

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    record?: FormTemplate | null;
    defaultPurpose?: FormTemplate['purpose'];
    lockPurpose?: boolean;
  }>(),
  {
    record: null,
    defaultPurpose: 'score_sheet',
    lockPurpose: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [template: FormTemplate];
}>();

const store = useFormTemplateStore();
const $q = useQuasar();
const tab = ref<'build' | 'preview'>('build');
const selectedId = ref('title');
const dragIndex = ref<number | null>(null);
const previewAnswers = ref<Record<string, unknown>>({});
const purposeOptions = [
  { label: 'Score sheet', value: 'score_sheet' },
  { label: 'Feedback', value: 'feedback' },
  { label: 'Appraisal', value: 'appraisal' },
  { label: 'General form', value: 'general' },
];
const questionTypeOptions = computed(() => FIELD_TYPE_OPTIONS.filter((option) => option.value !== 'section'));

const form = reactive({
  name: '',
  description: '',
  purpose: 'score_sheet' as 'score_sheet' | 'general' | 'feedback' | 'appraisal',
  is_active: true,
  schema: { fields: [] as FormField[] },
});

function typeMeta(type: FormFieldType) {
  return FIELD_TYPE_OPTIONS.find((option) => option.value === type);
}

function defaultQuestionType(): FormFieldType {
  return form.purpose === 'score_sheet' ? 'score' : 'text';
}

function reset() {
  form.name = props.record?.name ?? '';
  form.description = props.record?.description ?? '';
  form.purpose = props.record?.purpose ?? props.defaultPurpose ?? 'score_sheet';
  form.is_active = props.record?.is_active ?? true;
  form.schema = {
    fields: (props.record?.schema?.fields ?? []).map((field) => ({
      ...emptyField(field.type),
      ...field,
      options: field.options ? field.options.map((option) => ({ ...option })) : [],
    })),
  };
  if (!props.record && !form.schema.fields.length) {
    form.schema.fields.push(emptyField(defaultQuestionType()));
  }
  previewAnswers.value = {};
  tab.value = 'build';
  selectedId.value = 'title';
}

function addField(type: FormFieldType) {
  const field = emptyField(type);
  if (selectedId.value === 'title') {
    form.schema.fields.unshift(field);
  } else {
    const index = form.schema.fields.findIndex((item) => item.id === selectedId.value);
    if (index >= 0) {
      form.schema.fields.splice(index + 1, 0, field);
    } else {
      form.schema.fields.push(field);
    }
  }
  selectedId.value = field.id;
  tab.value = 'build';
  void nextTick(() => {
    document.getElementById(`form-field-${field.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
}

function removeField(index: number) {
  const removing = form.schema.fields[index];
  const next = form.schema.fields[index + 1] ?? form.schema.fields[index - 1];
  form.schema.fields.splice(index, 1);
  if (removing && selectedId.value === removing.id) {
    selectedId.value = next?.id ?? 'title';
  }
}

function duplicateField(index: number) {
  const field = form.schema.fields[index];
  if (!field) {
    return;
  }
  const copy: FormField = {
    ...field,
    id: crypto.randomUUID(),
    options: field.options?.map((option) => ({ ...option })) ?? [],
  };
  form.schema.fields.splice(index + 1, 0, copy);
  selectedId.value = copy.id;
}

function move(from: number, to: number) {
  if (to < 0 || to >= form.schema.fields.length || from === to) {
    return;
  }
  const field = form.schema.fields[from];
  if (!field) {
    return;
  }
  form.schema.fields.splice(from, 1);
  form.schema.fields.splice(to, 0, field);
}

function onDragStart(index: number, event: DragEvent) {
  dragIndex.value = index;
  event.dataTransfer?.setData('text/plain', String(index));
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
  }
}

function onDrop(index: number) {
  if (dragIndex.value == null) {
    return;
  }
  move(dragIndex.value, index);
  dragIndex.value = null;
}

function onTypeChange(field: FormField, type: FormFieldType) {
  if (type === 'select' || type === 'radio') {
    if (!field.options?.length) {
      field.options = [
        { value: 'option_1', label: 'Option 1' },
        { value: 'option_2', label: 'Option 2' },
      ];
    }
  }
  if (type === 'score' || type === 'number') {
    if (field.min == null) {
      field.min = 0;
    }
    if (type === 'score' && field.max == null) {
      field.max = 10;
    }
    if (type === 'score' && field.weight == null) {
      field.weight = 1;
    }
  }
}

function addOption(field: FormField) {
  const next = (field.options?.length ?? 0) + 1;
  (field.options ??= []).push({ label: `Option ${next}`, value: `option_${next}` });
}

function removeOption(field: FormField, optionIndex: number) {
  if ((field.options?.length ?? 0) <= 1) {
    return;
  }
  field.options?.splice(optionIndex, 1);
}

async function save() {
  if (!form.name.trim()) {
    selectedId.value = 'title';
    $q.notify({ type: 'negative', message: 'Name is required.' });
    return;
  }
  if (!form.schema.fields.length) {
    $q.notify({ type: 'negative', message: 'Add at least one question.' });
    return;
  }
  try {
    const saved = await store.saveTemplate(
      {
        name: form.name.trim(),
        description: form.description.trim() || null,
        purpose: form.purpose,
        is_active: form.is_active,
        schema: form.schema,
      },
      props.record?.id,
    );
    $q.notify({ type: 'positive', message: 'Form template saved.' });
    emit('saved', saved);
    emit('update:modelValue', false);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save form template.',
    });
  }
}

watch(
  () => [props.modelValue, props.record?.id],
  () => {
    if (props.modelValue) {
      reset();
    }
  },
  { immediate: true },
);

watch(selectedId, (id) => {
  if (tab.value !== 'build' || id === 'title') {
    return;
  }
  void nextTick(() => {
    document.getElementById(`form-field-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});
</script>

<style scoped lang="scss">
.form-builder-card {
  width: min(780px, 96vw);
}

.form-builder-card :deep(.app-dialog-body) {
  padding: 16px 20px 32px;
  background: #e8eef5;
}

.form-builder-canvas {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-builder-row {
  position: relative;
  margin-right: 56px;
}

.form-builder-title-card,
.form-builder-question {
  width: 100%;
  text-align: left;
  background: #fff;
  border: 0;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  overflow: hidden;
  position: relative;
}

.form-builder-title-card {
  cursor: pointer;
}

.form-builder-title-card__bar {
  height: 10px;
  background: var(--q-primary);
}

.form-builder-title-card__body,
.form-builder-question__preview,
.form-builder-question__edit {
  padding: 12px 24px 20px;
}

.form-builder-question :deep(.form-renderer) {
  padding: 16px 24px 20px;
}

.form-builder-title-card--selected,
.form-builder-question--selected {
  box-shadow: 0 1px 3px rgba(60, 64, 67, 0.3), 0 4px 8px 3px rgba(60, 64, 67, 0.15);
}

.form-builder-title-card--selected::after,
.form-builder-question--selected::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 6px;
  background: var(--q-primary);
}

.form-builder-question--section .form-builder-question__preview {
  background: #f8fafc;
}

.form-builder-question--dragging {
  opacity: 0.55;
}

.form-builder-title-input :deep(.q-field__control),
.form-builder-desc-input :deep(.q-field__control) {
  padding-left: 0;
  padding-right: 0;
}

.form-builder-title-input :deep(input) {
  font-size: 24px;
  font-weight: 400;
}

.form-builder-desc-input :deep(.q-field__native) {
  color: #5f6368;
}

.form-builder-preview-title {
  font-size: 24px;
  font-weight: 400;
  line-height: 1.3;
}

.form-builder-preview-desc {
  margin-top: 8px;
  color: #5f6368;
}

.form-builder-drag {
  display: flex;
  justify-content: center;
  padding-top: 6px;
  color: #80868b;
  cursor: grab;
  opacity: 0;
}

.form-builder-question:hover .form-builder-drag,
.form-builder-question--selected .form-builder-drag {
  opacity: 1;
}

.form-builder-question__label {
  font-size: 16px;
  margin-bottom: 12px;
}

.form-builder-fake-input {
  max-width: 420px;
  padding: 8px 0;
  color: #80868b;
  border-bottom: 1px dotted #dadce0;
}

.form-builder-fake-input--long {
  min-height: 64px;
}

.form-builder-fake-select {
  max-width: 220px;
  padding: 8px 12px;
  color: #5f6368;
  border: 1px solid #dadce0;
  border-radius: 4px;
}

.form-builder-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.form-builder-question__footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 16px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}

.form-builder-toolbar {
  position: absolute;
  top: 12px;
  right: -56px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15);
  padding: 4px;
  z-index: 2;
}

.form-builder-empty {
  padding: 24px;
  text-align: center;
  color: #5f6368;
  background: #fff;
  border-radius: 8px;
}

@media (max-width: 600px) {
  .form-builder-row {
    margin-right: 0;
  }

  .form-builder-toolbar {
    position: static;
    flex-direction: row;
    justify-content: center;
    margin-top: 8px;
    width: 100%;
  }
}
</style>
