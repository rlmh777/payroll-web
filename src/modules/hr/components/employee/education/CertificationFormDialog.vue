<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit certification' : 'Add certification' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="close" />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input v-model="form.name" label="Certification name *" dense outlined :disable="saving" />
          <q-input v-model="form.issuingOrganization" label="Issuing organization" dense outlined :disable="saving" />
          <q-input v-model="form.credentialId" label="Credential ID" dense outlined :disable="saving" />
          <DateField v-model="form.issuedOn" label="Issued on" clearable :disable="saving" />
          <DateField v-model="form.expiresOn" label="Expires on" clearable :disable="saving" />
          <q-input v-model="form.notes" type="textarea" label="Notes" dense outlined :disable="saving" />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import DateField from '@core/components/common/DateField.vue';
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

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 420px;
  height: 100vh;
}
</style>
