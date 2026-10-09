<template>
  <q-dialog :model-value="modelValue" @update:model-value="onToggle">
    <AppDialogCard modal>
      <AppDialogHeader>
        <div>
          <div class="text-h6">{{ vacancy?.title }} {{ isAdding ? 'application' : selected ? 'candidate' : 'applications' }}</div>
          <div class="text-caption text-grey-7">
            {{ selected?.candidate_stage?.name || `${store.applications.length} received` }}
          </div>
        </div>
      </AppDialogHeader>

      <AppDialogBody>
        <div v-if="selected" class="application-detail">
          <q-btn
            v-if="!application"
            flat
            dense
            no-caps
            icon="arrow_back"
            label="All applications"
            class="q-mb-md"
            @click="selected = null"
          />

          <div class="text-subtitle1">{{ selected.applicant?.name }}</div>
          <div class="text-body2 text-grey-8 q-mb-md">{{ selected.applicant?.email }}</div>

          <AppDialogForm>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Phone</div>
              <div>{{ selected.applicant?.phone || '—' }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Applied</div>
              <div>{{ formatDate(selected.created_at) }}</div>
            </div>
            <div class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">Stage</div>
              <div>{{ selected.candidate_stage?.name || '—' }}</div>
            </div>
            <div class="col-12">
              <div class="text-caption text-grey-7">Address</div>
              <div>{{ address(selected.applicant) }}</div>
            </div>
            <div v-if="selected.cover_letter && !selected.cover_letter_url" class="col-12">
              <div class="text-caption text-grey-7">Cover letter</div>
              <div class="cover-letter">{{ selected.cover_letter }}</div>
            </div>
            <div v-for="doc in applicationDocuments(selected)" :key="doc.label" class="col-12 col-sm-6">
              <div class="text-caption text-grey-7">{{ doc.label }}</div>
              <a v-if="doc.url" :href="doc.url" target="_blank" rel="noopener">{{ doc.name }}</a>
              <span v-else>—</span>
            </div>
          </AppDialogForm>

          <q-banner v-if="selected.matching_employee" class="bg-blue-1 q-mt-md" rounded>
            This applicant matches employee
            {{ selected.matching_employee.firstName }} {{ selected.matching_employee.lastName }}
            <span v-if="selected.matching_employee.code">({{ selected.matching_employee.code }})</span>.
            Converting will update that employee instead of creating a new one.
          </q-banner>

          <q-banner v-else-if="selected.status === 'converted'" class="bg-green-1 q-mt-md" rounded>
            Converted to an employee.
          </q-banner>

          <div v-if="showConvertForm" class="q-mt-md">
            <div class="text-subtitle2 q-mb-sm">Employee details</div>
            <AppDialogForm>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.first_name" outlined dense label="First name" />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.last_name" outlined dense label="Last name" />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.email" outlined dense label="Email" />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.phone" outlined dense label="Phone" />
              </div>
              <div class="col-12">
                <q-input v-model="convertForm.address1" outlined dense label="Address" />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.birthdate" outlined dense type="date" label="Birthdate" />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="convertForm.gender_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Gender"
                  :options="genderOptions"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="convertForm.locality_id"
                  outlined
                  dense
                  emit-value
                  map-options
                  use-input
                  input-debounce="200"
                  label="Locality"
                  :options="localityOptions"
                  @filter="filterLocalities"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="convertForm.social_security_number" outlined dense label="Social security number" />
              </div>
              <div class="col-12">
                <q-select
                  v-model="convertForm.paymentMethodId"
                  outlined
                  dense
                  emit-value
                  map-options
                  label="Payment method"
                  :options="paymentOptions"
                />
              </div>
            </AppDialogForm>
          </div>
        </div>

        <div v-else-if="isAdding">
          <q-btn
            v-if="!adding"
            flat
            dense
            no-caps
            icon="arrow_back"
            label="All applications"
            class="q-mb-md"
            @click="isAdding = false"
          />
          <AppDialogForm>
            <div class="col-12 col-sm-6">
              <q-input v-model="addForm.first_name" outlined dense label="First name" :rules="[required]">
                <template #prepend>
                  <q-icon name="person" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="addForm.last_name" outlined dense label="Last name" :rules="[required]">
                <template #prepend>
                  <q-icon name="badge" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="addForm.email" outlined dense label="Email" :rules="[required]">
                <template #prepend>
                  <q-icon name="email" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="addForm.phone" outlined dense label="Phone">
                <template #prepend>
                  <q-icon name="phone" />
                </template>
              </q-input>
            </div>
            <div class="col-12 col-sm-6">
              <q-file
                v-model="addForm.cover_letter"
                outlined
                dense
                clearable
                label="Cover letter"
                accept=".pdf,.doc,.docx"
              >
                <template #prepend>
                  <q-icon name="article" />
                </template>
              </q-file>
            </div>
            <div class="col-12 col-sm-6">
              <q-file
                v-model="addForm.resume"
                outlined
                dense
                clearable
                label="Resume"
                accept=".pdf,.doc,.docx"
              >
                <template #prepend>
                  <q-icon name="description" />
                </template>
              </q-file>
            </div>
            <div class="col-12 col-sm-6">
              <q-file
                v-model="addForm.social_security"
                outlined
                dense
                clearable
                label="Social security card"
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <template #prepend>
                  <q-icon name="verified_user" />
                </template>
              </q-file>
            </div>
            <div class="col-12 col-sm-6">
              <q-file
                v-model="addForm.passport"
                outlined
                dense
                clearable
                label="Passport"
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <template #prepend>
                  <q-icon name="flight" />
                </template>
              </q-file>
            </div>
            <div class="col-12 col-sm-6">
              <q-file
                v-model="addForm.police_record"
                outlined
                dense
                clearable
                label="Police record"
                accept=".pdf,.jpg,.jpeg,.png"
              >
                <template #prepend>
                  <q-icon name="gavel" />
                </template>
              </q-file>
            </div>
          </AppDialogForm>
        </div>

        <div v-else>
          <q-inner-loading :showing="store.isLoadingApplications" />
          <q-list v-if="store.applications.length" separator>
            <q-item
              v-for="application in store.applications"
              :key="application.id"
              clickable
              v-ripple
              @click="openDetail(application)"
            >
              <q-item-section>
                <q-item-label>{{ application.applicant?.name }}</q-item-label>
                <q-item-label caption>{{ application.applicant?.email }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-badge :color="application.status === 'converted' ? 'positive' : 'grey-7'">
                  {{ application.status }}
                </q-badge>
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else class="text-grey-7 q-pa-md">No applications yet.</div>
        </div>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn v-if="canEdit && !selected && !isAdding" flat label="Add application" @click="isAdding = true" />
        <q-btn v-if="isAdding" color="primary" :loading="store.isSaving" label="Save" @click="saveApplication" />
        <q-btn
          v-if="selected && canConvert && selected.status !== 'converted'"
          color="primary"
          :loading="store.isSaving"
          :label="selected.matching_employee ? 'Update employee' : 'Convert to employee'"
          @click="convertApplicant"
        />
        <q-btn
          v-if="selected?.matching_employee"
          flat
          label="View employee"
          :to="employeePath(selected.matching_employee.id, route.path)"
        />
        <q-btn flat label="Close" @click="onToggle(false)" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar, type QSelectProps } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
import { usePermissions } from '@core/composables/usePermissions';
import { employeePath } from '@core/config/module-routes';
import { useEmployeeStore } from '@hr/stores/employee-store';
import {
  useVacancyStore,
  type ConvertApplicantPayload,
  type Vacancy,
  type VacancyApplicant,
  type VacancyApplication,
} from '@hr/stores/vacancy-store';

const props = defineProps<{
  modelValue: boolean;
  vacancy?: Vacancy | null;
  application?: VacancyApplication | null;
  adding?: boolean;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  closed: [];
}>();

const store = useVacancyStore();
const employeeStore = useEmployeeStore();
const { can } = usePermissions();
const $q = useQuasar();
const route = useRoute();

const canEdit = computed(() => can('vacancies-crud'));
const canConvert = computed(() => can('employees-crud'));
const selected = ref<VacancyApplication | null>(null);
const isAdding = ref(false);
const localityOptions = ref<QSelectProps['options']>([]);

const addForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  cover_letter: null as File | null,
  resume: null as File | null,
  social_security: null as File | null,
  passport: null as File | null,
  police_record: null as File | null,
});

const convertForm = reactive({
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  address1: '',
  birthdate: '',
  gender_id: null as number | null,
  locality_id: null as string | null,
  social_security_number: '',
  paymentMethodId: null as number | null,
});

const genderOptions = computed(() =>
  employeeStore.genders.map((item) => ({ label: item.name, value: item.id })),
);
const paymentOptions = computed(() =>
  employeeStore.paymentMethods.map((item) => ({ label: item.name, value: item.id })),
);
const showConvertForm = computed(
  () => selected.value && canConvert.value && selected.value.status !== 'converted',
);

const required = (value: string) => !!value?.trim() || 'Required';

function address(applicant?: VacancyApplicant | null) {
  if (!applicant) {
    return '—';
  }
  return [applicant.address1, applicant.address2, applicant.locality?.name].filter(Boolean).join(', ') || '—';
}

function formatDate(value?: string | null) {
  if (!value) {
    return '—';
  }
  return new Date(value).toLocaleString();
}

function resetAddForm() {
  addForm.first_name = '';
  addForm.last_name = '';
  addForm.email = '';
  addForm.phone = '';
  addForm.cover_letter = null;
  addForm.resume = null;
  addForm.social_security = null;
  addForm.passport = null;
  addForm.police_record = null;
}

function applicationDocuments(application: VacancyApplication) {
  return [
    { label: 'Cover letter', url: application.cover_letter_url, name: application.cover_letter_name || 'Download cover letter' },
    { label: 'Resume', url: application.resume_url, name: application.resume_name || 'Download resume' },
    { label: 'Social security card', url: application.social_security_url, name: application.social_security_name || 'Download social security' },
    { label: 'Passport', url: application.passport_url, name: application.passport_name || 'Download passport' },
    { label: 'Police record', url: application.police_record_url, name: application.police_record_name || 'Download police record' },
  ];
}

function fillConvertForm(application: VacancyApplication) {
  const applicant = application.applicant;
  convertForm.first_name = applicant?.first_name ?? '';
  convertForm.last_name = applicant?.last_name ?? '';
  convertForm.email = applicant?.email ?? '';
  convertForm.phone = applicant?.phone ?? '';
  convertForm.address1 = applicant?.address1 ?? '';
  convertForm.birthdate = applicant?.birthdate ?? '';
  convertForm.gender_id = applicant?.gender_id ?? null;
  convertForm.locality_id = applicant?.locality_id ?? null;
  convertForm.social_security_number = applicant?.social_security_number ?? '';
  convertForm.paymentMethodId = null;
}

function openDetail(application: VacancyApplication) {
  selected.value = application;
  fillConvertForm(application);
}

function filterLocalities(value: string, update: (fn: () => void) => void) {
  update(() => {
    const needle = value.toLowerCase();
    localityOptions.value = employeeStore.localities.flatMap((item) => {
      const name = item.name ?? '';
      if (!name || (needle && !name.toLowerCase().includes(needle))) {
        return [];
      }
      return [{ label: name, value: item.id }];
    });
  });
}

async function saveApplication() {
  if (!props.vacancy) {
    return;
  }
  try {
    await store.createApplication(props.vacancy.id, {
      first_name: addForm.first_name.trim(),
      last_name: addForm.last_name.trim(),
      email: addForm.email.trim(),
      phone: addForm.phone.trim() || null,
      cover_letter: addForm.cover_letter,
      resume: addForm.resume,
      social_security: addForm.social_security,
      passport: addForm.passport,
      police_record: addForm.police_record,
    });
    isAdding.value = false;
    resetAddForm();
    $q.notify({ type: 'positive', message: 'Application saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not save application.',
    });
  }
}

async function convertApplicant() {
  if (!props.vacancy || !selected.value) {
    return;
  }
  const payload: ConvertApplicantPayload = {
    first_name: convertForm.first_name.trim(),
    last_name: convertForm.last_name.trim(),
    email: convertForm.email.trim(),
    phone: convertForm.phone.trim() || null,
    address1: convertForm.address1.trim() || null,
    birthdate: convertForm.birthdate || null,
    gender_id: convertForm.gender_id,
    locality_id: convertForm.locality_id,
    social_security_number: convertForm.social_security_number.trim() || null,
    paymentMethodId: convertForm.paymentMethodId,
  };
  try {
    const result = await store.convertApplication(props.vacancy.id, selected.value.id, payload);
    selected.value = result.application;
    $q.notify({
      type: 'positive',
      message: result.action === 'updated'
        ? 'Existing employee updated from this applicant.'
        : 'Applicant converted to a new employee.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not convert applicant.',
    });
  }
}

function onToggle(value: boolean) {
  emit('update:modelValue', value);
  if (!value) {
    emit('closed');
  }
}

watch(
  () => [props.modelValue, props.vacancy?.id, props.application?.id, props.adding],
  async () => {
    selected.value = props.application ?? null;
    isAdding.value = Boolean(props.adding) && !props.application;
    if (selected.value) {
      fillConvertForm(selected.value);
    }
    if (!props.modelValue || !props.vacancy) {
      return;
    }
    await store.fetchApplications(props.vacancy.id);
    await Promise.all([
      employeeStore.fetchGenders(),
      employeeStore.fetchLocalities(),
      employeeStore.fetchPaymentMethods(),
    ]);
    localityOptions.value = employeeStore.localities.map((item) => ({
      label: item.name ?? '',
      value: item.id,
    }));
    if (props.application) {
      selected.value = store.applications.find((item) => item.id === props.application?.id) ?? props.application;
      fillConvertForm(selected.value);
    }
  },
);
</script>

<style scoped>
.cover-letter {
  white-space: pre-wrap;
}
</style>
