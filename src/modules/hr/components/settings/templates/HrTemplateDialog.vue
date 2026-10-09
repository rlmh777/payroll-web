<template>
  <q-dialog :model-value="modelValue" position="right" @update:model-value="emit('update:modelValue', $event)">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ record ? 'Edit template' : 'Add template' }}</div>
      </AppDialogHeader>
      <AppDialogBody>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="form.name"
            outlined
            dense
            label="Name"
            :rules="[(v) => !!String(v || '').trim() || 'Name is required']"
          />
          <q-select
            v-model="form.category"
            outlined
            dense
            emit-value
            map-options
            label="Used for"
            :options="store.categories"
          />
          <q-input
            v-if="channel === 'email'"
            v-model="form.subject"
            outlined
            dense
            label="Email subject"
            :rules="channel === 'email' ? [(v) => !!String(v || '').trim() || 'Subject is required'] : []"
          />
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">Merge fields — click to insert</div>
            <div class="q-gutter-xs">
              <q-chip
                v-for="item in store.placeholders"
                :key="item.token"
                clickable
                outline
                color="primary"
                dense
                @click="insertToken(item.token)"
              >
                {{ item.label }}
              </q-chip>
            </div>
          </div>
          <div>
            <div class="text-caption text-grey-7 q-mb-xs">{{ channel === 'email' ? 'Email body' : 'Letter body' }}</div>
            <q-editor
              v-model="form.body"
              min-height="220px"
              :toolbar="editorToolbar"
            />
          </div>
          <q-toggle v-model="form.is_active" color="primary" label="Active" />
        </q-form>
      </AppDialogBody>
      <AppDialogActions>
        <q-btn v-close-popup flat label="Cancel" color="grey" :disable="store.isSaving" />
        <q-btn color="primary" label="Save" :loading="store.isSaving" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import { VACANCY_EDITOR_TOOLBAR } from '@hr/components/vacancies/vacancy-attachments';
import {
  useHrTemplateStore,
  type HrTemplate,
  type HrTemplateChannel,
} from '@hr/stores/hr-template-store';

const props = defineProps<{
  modelValue: boolean;
  channel: HrTemplateChannel;
  record?: HrTemplate | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useHrTemplateStore();
const editorToolbar = VACANCY_EDITOR_TOOLBAR;

const form = reactive({
  name: '',
  category: '',
  subject: '',
  body: '',
  is_active: true,
});

function resetForm() {
  form.name = props.record?.name ?? '';
  form.category = props.record?.category ?? store.categories[0]?.value ?? (props.channel === 'email' ? 'other' : 'other');
  form.subject = props.record?.subject ?? '';
  form.body = props.record?.body ?? '';
  form.is_active = props.record?.is_active ?? true;
}

watch(
  () => [props.modelValue, props.record] as const,
  () => {
    if (props.modelValue) {
      resetForm();
    }
  },
  { immediate: true },
);

function insertToken(token: string) {
  form.body = `${form.body || ''}${form.body ? ' ' : ''}${token}`;
}

async function save() {
  if (!form.name.trim() || !form.body.trim()) {
    $q.notify({ type: 'warning', message: 'Name and body are required.' });
    return;
  }
  if (props.channel === 'email' && !form.subject.trim()) {
    $q.notify({ type: 'warning', message: 'Subject is required for email templates.' });
    return;
  }

  try {
    await store.saveTemplate(
      {
        channel: props.channel,
        category: form.category,
        name: form.name.trim(),
        subject: props.channel === 'email' ? form.subject.trim() : null,
        body: form.body,
        is_active: form.is_active,
      },
      props.record?.id,
    );
    $q.notify({ type: 'positive', message: 'Template saved.' });
    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save template.',
    });
  }
}
</script>
