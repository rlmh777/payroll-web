<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit education' : 'Add education' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="close" />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <InstitutionSelect v-model="form.institutionId" :disable="saving" />
          <DegreeSelect v-model="form.degreeId" :disable="saving" />
          <DateField v-model="form.from" label="Start date *" :disable="saving" />
          <DateField v-model="form.to" label="End date" clearable :disable="saving" />
          <q-input v-model="form.note" type="textarea" label="Notes" dense outlined :disable="saving" />
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
import InstitutionSelect from '../common/InstitutionSelect.vue';
import DegreeSelect from '../common/DegreeSelect.vue';
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
});

watch(
  () => props.record,
  (record) => {
    form.institutionId = record?.institutionId ?? null;
    form.degreeId = record?.degreeId ?? null;
    form.from = record?.from ?? '';
    form.to = record?.to ?? null;
    form.note = record?.note ?? '';
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
      await store.updateRecord(props.record.id, payload);
    } else {
      await store.createRecord(payload);
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

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 420px;
  height: 100vh;
}
</style>
