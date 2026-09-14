<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit education' : 'Add education' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <InstitutionSelect v-model="form.institutionId" :disable="saving" />
            </div>
            <div class="col-12">
              <DegreeSelect v-model="form.degreeId" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <DateField v-model="form.from" label="Start date *" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <DateField v-model="form.to" label="End date" clearable :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.note" type="textarea" label="Notes" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-file
                v-model="form.attachmentFile"
                label="Attachment"
                hint="PDF, Word, Excel, images, or text. Max 20 MB."
                :accept="EDUCATION_ATTACHMENT_ACCEPT"
                dense
                outlined
                clearable
                :disable="saving"
              >
                <template #prepend>
                  <q-icon name="upload_file" />
                </template>
              </q-file>
            </div>
            <div
              v-if="existingFileName && !form.attachmentFile"
              class="col-12 text-caption text-grey-7"
            >
              Current file:
              <a
                v-if="existingFileUrl"
                :href="existingFileUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ existingFileName }}
              </a>
              <span v-else>{{ existingFileName }}</span>
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
        <q-btn color="primary" :loading="saving" label="Save" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import InstitutionSelect from '../common/InstitutionSelect.vue';
import DegreeSelect from '../common/DegreeSelect.vue';
import {
  EDUCATION_ATTACHMENT_ACCEPT,
  educationAttachmentDisplayName,
  resolveEducationAttachmentUrl,
} from './education-attachment';
import {
  useEmployeeQualificationStore,
  type EmployeeQualification,
} from 'src/stores/employee-qualification-store';

const props = defineProps<{
  employeeId: string;
  modelValue: boolean;
  record?: EmployeeQualification | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useEmployeeQualificationStore();
const saving = ref(false);

const isEdit = computed(() => Boolean(props.record?.id));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  institutionId: null as number | null,
  degreeId: null as number | null,
  from: '',
  to: null as string | null,
  note: '',
  attachmentFile: null as File | null,
});

const existingFileName = computed(() =>
  educationAttachmentDisplayName(props.record?.fileName, props.record?.filePath),
);
const existingFileUrl = computed(() =>
  resolveEducationAttachmentUrl(props.record?.fileUrl, props.record?.filePath),
);

watch(
  () => props.record,
  (record) => {
    form.institutionId = record?.institutionId ?? null;
    form.degreeId = record?.degreeId ?? null;
    form.from = record?.from ?? '';
    form.to = record?.to ?? null;
    form.note = record?.note ?? '';
    form.attachmentFile = null;
  },
  { immediate: true },
);

function onDialogUpdate(value: boolean) {
  open.value = value;
}

function close() {
  open.value = false;
}

async function save() {
  if (!form.institutionId || !form.degreeId || !form.from) {
    $q.notify({ color: 'negative', position: 'top', message: 'Institution, degree, and start date are required.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      institutionId: form.institutionId,
      degreeId: form.degreeId,
      from: form.from,
      to: form.to || null,
      note: form.note || null,
    };

    if (isEdit.value && props.record) {
      await store.updateRecord(props.record.id, payload, form.attachmentFile);
    } else {
      await store.createRecord(payload, form.attachmentFile);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Education record saved.' });
    emit('saved');
    close();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}
</script>
