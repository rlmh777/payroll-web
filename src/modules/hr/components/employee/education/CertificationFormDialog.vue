<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit certification' : 'Add certification' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-input v-model="form.name" label="Certification name *" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.issuingOrganization" label="Issuing organization" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.credentialId" label="Credential ID" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <DateField v-model="form.issuedOn" label="Issued on" clearable :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <DateField v-model="form.expiresOn" label="Expires on" clearable :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.notes" type="textarea" label="Notes" dense outlined :disable="saving" />
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
import {
  useEmployeeCertificationStore,
  type EmployeeCertification,
} from 'src/stores/employee-certification-store';

const props = defineProps<{
  employeeId: string;
  modelValue: boolean;
  record?: EmployeeCertification | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useEmployeeCertificationStore();
const saving = ref(false);

const isEdit = computed(() => Boolean(props.record?.id));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  name: '',
  issuingOrganization: '',
  credentialId: '',
  issuedOn: null as string | null,
  expiresOn: null as string | null,
  notes: '',
});

watch(
  () => props.record,
  (record) => {
    form.name = record?.name ?? '';
    form.issuingOrganization = record?.issuingOrganization ?? '';
    form.credentialId = record?.credentialId ?? '';
    form.issuedOn = record?.issuedOn ?? null;
    form.expiresOn = record?.expiresOn ?? null;
    form.notes = record?.notes ?? '';
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
  if (!form.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Certification name is required.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      name: form.name.trim(),
      issuingOrganization: form.issuingOrganization || null,
      credentialId: form.credentialId || null,
      issuedOn: form.issuedOn || null,
      expiresOn: form.expiresOn || null,
      notes: form.notes || null,
    };

    if (isEdit.value && props.record) {
      await store.updateRecord(props.record.id, payload);
    } else {
      await store.createRecord(payload);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Certification saved.' });
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
