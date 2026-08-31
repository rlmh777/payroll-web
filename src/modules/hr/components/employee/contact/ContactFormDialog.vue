<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit contact' : 'Add contact' }}</div>
        <template #close>
          <q-btn icon="close" flat round dense :disable="saving" @click="close" />
        </template>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.firstName" label="First name *" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.middleName" label="Middle name" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.lastName" label="Last name *" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <RelationshipSelect v-model="form.relationshipId" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phoneNumber1" label="Phone *" dense outlined :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phoneNumber2" label="Alternate phone" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.email" label="Email *" type="email" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.address1" label="Address 1 *" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <q-input v-model="form.address2" label="Address 2" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
              <LocalitySelect v-model="form.localityId" :readonly="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.isDependent" label="Dependent" :disable="saving" />
            </div>
            <div class="col-12 col-sm-6">
              <q-toggle v-model="form.isProfessionalReference" label="Professional reference" :disable="saving" />
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
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import LocalitySelect from '../common/LocalitySelect.vue';
import RelationshipSelect from '../common/RelationshipSelect.vue';
import {
  useEmployeeContactStore,
  type EmployeeContactRecord,
} from 'src/stores/employee-contact-store';

const props = defineProps<{
  employeeId: string;
  modelValue: boolean;
  record?: EmployeeContactRecord | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useEmployeeContactStore();
const saving = ref(false);

const isEdit = computed(() => Boolean(props.record?.id));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  firstName: '',
  middleName: '',
  lastName: '',
  phoneNumber1: '',
  phoneNumber2: '',
  email: '',
  address1: '',
  address2: '',
  localityId: '',
  relationshipId: null as number | null,
  isDependent: false,
  isProfessionalReference: false,
});

watch(
  () => props.record,
  (record) => {
    form.firstName = record?.firstName ?? '';
    form.middleName = record?.middleName ?? '';
    form.lastName = record?.lastName ?? '';
    form.phoneNumber1 = record?.phoneNumber1 ?? '';
    form.phoneNumber2 = record?.phoneNumber2 ?? '';
    form.email = record?.email ?? '';
    form.address1 = record?.address1 ?? '';
    form.address2 = record?.address2 ?? '';
    form.localityId = record?.localityId ?? '';
    form.relationshipId = record?.relationshipId ?? null;
    form.isDependent = Boolean(record?.isDependent);
    form.isProfessionalReference = Boolean(record?.isProfessionalReference);
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
  if (!form.firstName.trim() || !form.lastName.trim() || !form.phoneNumber1.trim() || !form.email.trim() || !form.address1.trim() || !form.localityId || !form.relationshipId) {
    $q.notify({ color: 'negative', position: 'top', message: 'Please complete all required contact fields.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      firstName: form.firstName.trim(),
      middleName: form.middleName || null,
      lastName: form.lastName.trim(),
      phoneNumber1: form.phoneNumber1.trim(),
      phoneNumber2: form.phoneNumber2 || null,
      email: form.email.trim(),
      address1: form.address1.trim(),
      address2: form.address2 || null,
      localityId: form.localityId,
      relationshipId: form.relationshipId,
      isDependent: form.isDependent,
      isProfessionalReference: form.isProfessionalReference,
    };

    if (isEdit.value && props.record) {
      await store.updateRecord(props.record.id, payload);
    } else {
      await store.createRecord(payload);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Contact saved.' });
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
