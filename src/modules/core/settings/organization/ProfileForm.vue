<template>
  <q-form :id="formId" @submit.prevent="submitForm" class="organization-form">
    <div class="row q-col-gutter-md items-start">
      <div class="col-12 col-xl-9">
        <div class="row q-col-gutter-x-md q-col-gutter-y-sm">
          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">LEGAL NAME</div>
            <q-input v-model="form.legalName" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">ALIAS</div>
            <q-input v-model="form.alias" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">LOCALITY</div>
            <q-select
              v-model="form.localityId"
              :options="localityOptions"
              option-value="id"
              option-label="name"
              emit-value
              map-options
              dense
              filled
              hide-bottom-space
              :loading="localityStore.isLoading"
            />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">SOCIAL SECURITY NUMBER</div>
            <q-input v-model="form.socialSecurityNumber" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">TAX ID</div>
            <q-input v-model="form.taxIdentificationNumber" type="text" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">EMAIL</div>
            <q-input v-model="form.email" type="email" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">PHONE NUMBER 1</div>
            <q-input v-model="form.phoneNumber1" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-sm-6 col-lg-4">
            <div class="section-label">PHONE NUMBER 2</div>
            <q-input v-model="form.phoneNumber2" dense filled hide-bottom-space />
          </div>

          <div class="col-12 col-lg-8">
            <div class="section-label">STREET</div>
            <q-input v-model="form.street" dense filled hide-bottom-space />
          </div>
        </div>
      </div>

      <div class="col-12 col-xl-3">
        <div class="theme-panel q-pa-md rounded-borders">
          <div class="section-label q-mb-xs">THEME</div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Applied to header, buttons, and accents.
          </div>

          <div class="q-mb-sm">
            <div class="section-label">PRIMARY</div>
            <div class="row items-center q-gutter-xs no-wrap">
              <q-input v-model="form.primaryColor" dense filled hide-bottom-space class="col">
                <template #prepend>
                  <div class="color-swatch" :style="{ backgroundColor: primaryPreviewColor }" />
                </template>
              </q-input>
              <q-btn flat round dense icon="palette" aria-label="Pick primary color">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="form.primaryColor" format-model="hex" />
                </q-popup-proxy>
              </q-btn>
            </div>
          </div>

          <div class="q-mb-md">
            <div class="section-label">SECONDARY</div>
            <div class="row items-center q-gutter-xs no-wrap">
              <q-input v-model="form.secondaryColor" dense filled hide-bottom-space class="col">
                <template #prepend>
                  <div class="color-swatch" :style="{ backgroundColor: secondaryPreviewColor }" />
                </template>
              </q-input>
              <q-btn flat round dense icon="palette" aria-label="Pick secondary color">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-color v-model="form.secondaryColor" format-model="hex" />
                </q-popup-proxy>
              </q-btn>
            </div>
          </div>

          <div class="theme-preview q-pa-sm rounded-borders">
            <div class="text-caption text-grey-7 q-mb-xs">Preview</div>
            <div
              class="preview-header text-white q-px-sm q-py-xs rounded-borders q-mb-xs"
              :style="headerPreviewStyle"
            >
              Header
            </div>
            <q-btn
              unelevated
              dense
              no-caps
              class="full-width q-mb-xs"
              label="Primary"
              :style="primaryButtonStyle"
            />
            <q-btn
              unelevated
              dense
              no-caps
              class="full-width"
              label="Secondary"
              :style="secondaryButtonStyle"
            />
          </div>
        </div>
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useLocalityStore } from '../../stores/locality-store';
import { resolveCompanyTheme } from '@core/utils/company-theme';
import type { Organization } from '../../stores/organization-store';

const props = defineProps<{
  org: Organization;
  loading?: boolean;
  formId?: string;
}>();

const emit = defineEmits<{
  (e: 'update', payload: Organization): void;
  (e: 'preview-theme', payload: { primaryColor?: string; secondaryColor?: string }): void;
}>();

const localityStore = useLocalityStore();
const form = ref<Organization>({ ...props.org });

const localityOptions = computed(() => localityStore.localities);

const themePreview = computed(() =>
  resolveCompanyTheme(form.value.primaryColor, form.value.secondaryColor),
);

const primaryPreviewColor = computed(() => themePreview.value.primaryColor);
const secondaryPreviewColor = computed(() => themePreview.value.secondaryColor);

const headerPreviewStyle = computed(() => ({
  backgroundColor: primaryPreviewColor.value,
}));

const primaryButtonStyle = computed(() => ({
  backgroundColor: primaryPreviewColor.value,
  color: '#fff',
}));

const secondaryButtonStyle = computed(() => ({
  backgroundColor: secondaryPreviewColor.value,
  color: '#fff',
}));

watch(
  () => props.org,
  (newOrg) => {
    form.value = { ...newOrg };
  },
  { deep: true },
);

watch(
  () => [form.value.primaryColor, form.value.secondaryColor],
  () => {
    const payload: { primaryColor?: string; secondaryColor?: string } = {};
    if (form.value.primaryColor) {
      payload.primaryColor = form.value.primaryColor;
    }
    if (form.value.secondaryColor) {
      payload.secondaryColor = form.value.secondaryColor;
    }
    emit('preview-theme', payload);
  },
);

onMounted(async () => {
  if (!localityStore.localities.length) {
    await localityStore.fetchLocalities({ page: 1, perPage: 100 });
  }

  if (!form.value.primaryColor) {
    form.value.primaryColor = themePreview.value.primaryColor;
  }

  if (!form.value.secondaryColor) {
    form.value.secondaryColor = themePreview.value.secondaryColor;
  }
});

const submitForm = () => {
  emit('update', form.value);
};
</script>

<style scoped>
.section-label {
  font-size: 10px;
  font-weight: bold;
  color: #999;
  margin-bottom: 2px;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.12);
}

.theme-panel {
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

@media (min-width: 1440px) {
  .theme-panel {
    position: sticky;
    top: 8px;
  }
}

.theme-preview {
  background: #f5f5f5;
}

.preview-header {
  font-size: 12px;
  font-weight: 600;
}
</style>
