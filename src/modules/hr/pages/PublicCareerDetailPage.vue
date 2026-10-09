<template>
  <q-page class="q-pa-md career-detail">
    <q-btn flat no-caps icon="arrow_back" label="All jobs" to="/careers" class="q-mb-md" />

    <div v-if="store.isLoadingPublic" class="flex flex-center q-pa-xl">
      <q-spinner color="primary" size="40px" />
    </div>

    <q-banner v-else-if="!job" class="bg-grey-2" rounded>
      This job is not available.
    </q-banner>

    <div v-else class="q-gutter-md">
      <q-card flat bordered>
        <q-card-section>
          <div class="text-h5">{{ job.title }}</div>
          <div class="text-subtitle1 text-grey-8">{{ job.job_title?.name }}</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            <div v-if="job.worksite">Location: {{ job.worksite.name }}</div>
            <div v-if="job.department">Department: {{ job.department.name }}</div>
            <div>{{ job.positions }} open position{{ job.positions === 1 ? '' : 's' }}</div>
            <div>{{ job.require_resume ? 'A resume is required.' : 'A resume is not required.' }}</div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="text-subtitle2 q-mb-sm">Job description</div>
          <div
            class="job-description"
            :class="{ 'job-description--plain': isPlainDescription }"
            v-html="job.description || 'No description provided.'"
          />
          <div v-if="job.attachments?.length" class="q-mt-md q-gutter-xs">
            <div class="text-caption text-grey-7">Attachments</div>
            <div v-for="file in job.attachments" :key="file.id">
              <a
                v-if="file.file_url"
                :href="file.file_url"
                target="_blank"
                rel="noopener"
              >
                {{ file.file_name }}
              </a>
              <span v-else>{{ file.file_name }}</span>
            </div>
          </div>
          <div v-if="job.job_title?.jobDescriptionUrl" class="q-mt-md">
            <a :href="job.job_title.jobDescriptionUrl" target="_blank" rel="noopener">
              Download job title description
            </a>
          </div>
        </q-card-section>
      </q-card>

      <q-card v-if="submitted" flat bordered>
        <q-card-section>
          <div class="text-h6">Application received</div>
          <div class="text-body2 text-grey-7 q-mt-sm">
            Thank you. We will review your application for {{ job.title }}.
          </div>
        </q-card-section>
      </q-card>

      <q-card v-else flat bordered>
        <q-card-section>
          <div class="text-h6">Apply</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <q-form class="q-gutter-md" @submit.prevent="apply">
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.first_name"
                  outlined
                  dense
                  label="First name"
                  :rules="[required]"
                >
                  <template #prepend>
                    <q-icon name="person" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.last_name"
                  outlined
                  dense
                  label="Last name"
                  :rules="[required]"
                >
                  <template #prepend>
                    <q-icon name="badge" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.email"
                  outlined
                  dense
                  type="email"
                  label="Email"
                  :rules="[required]"
                >
                  <template #prepend>
                    <q-icon name="email" />
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.phone" outlined dense label="Phone">
                  <template #prepend>
                    <q-icon name="phone" />
                  </template>
                </q-input>
              </div>
            </div>

            <div class="text-subtitle2 q-mt-sm">Documents</div>
            <div class="text-caption text-grey-7">
              Upload a cover letter (PDF or Word). Identity documents can be PDF or image files.
            </div>
            <div class="row q-col-gutter-md">
              <div class="col-12 col-sm-6">
                <q-file
                  v-model="form.cover_letter"
                  outlined
                  dense
                  clearable
                  label="Cover letter"
                  accept=".pdf,.doc,.docx"
                  :rules="[requiredFile('A cover letter is required')]"
                >
                  <template #prepend>
                    <q-icon name="article" />
                  </template>
                </q-file>
              </div>
              <div class="col-12 col-sm-6">
                <q-file
                  v-model="form.resume"
                  outlined
                  dense
                  clearable
                  label="Resume"
                  accept=".pdf,.doc,.docx"
                  :rules="job.require_resume ? [requiredFile('A resume is required')] : []"
                >
                  <template #prepend>
                    <q-icon name="description" />
                  </template>
                </q-file>
              </div>
              <div class="col-12 col-sm-6">
                <q-file
                  v-model="form.social_security"
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
                  v-model="form.passport"
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
                  v-model="form.police_record"
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
            </div>
            <div class="row justify-end">
              <q-btn type="submit" color="primary" icon="send" :loading="submitting" label="Submit application" />
            </div>
          </q-form>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useQuasar } from 'quasar';
import { useVacancyStore } from '@hr/stores/vacancy-store';

const route = useRoute();
const store = useVacancyStore();
const $q = useQuasar();
const job = computed(() => store.selectedPublicVacancy);
const submitting = ref(false);
const submitted = ref(false);
const isPlainDescription = computed(() => {
  const text = job.value?.description ?? '';
  return text !== '' && !/<[a-z][\s\S]*>/i.test(text);
});

const form = reactive({
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

const required = (value: string) => !!value?.trim() || 'Required';
const requiredFile = (message: string) => (value: File | File[] | null) => !!value || message;

async function load() {
  submitted.value = false;
  const id = String(route.params.id ?? '');
  if (!id) {
    return;
  }
  try {
    await store.fetchPublicVacancy(id);
  } catch {
    store.selectedPublicVacancy = null;
  }
}

async function apply() {
  if (!job.value) {
    return;
  }
  submitting.value = true;
  try {
    await store.submitPublicApplication(job.value.id, {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      cover_letter: form.cover_letter,
      resume: form.resume,
      social_security: form.social_security,
      passport: form.passport,
      police_record: form.police_record,
    });
    submitted.value = true;
    $q.notify({ type: 'positive', message: 'Application submitted.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Could not submit application.',
    });
  } finally {
    submitting.value = false;
  }
}

onMounted(() => {
  void load();
});

watch(() => route.params.id, () => {
  void load();
});
</script>

<style scoped>
.career-detail {
  max-width: 800px;
  margin: 0 auto;
}
.job-description {
  line-height: 1.5;
}
.job-description--plain {
  white-space: pre-wrap;
}
.job-description :deep(p) {
  margin: 0 0 0.75em;
}
.job-description :deep(ul),
.job-description :deep(ol) {
  padding-left: 1.25em;
  margin: 0 0 0.75em;
}
</style>
