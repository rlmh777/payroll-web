<template>
  <q-form @submit.prevent="submitForm" class="q-gutter-y-md q-pl-md">
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-6">
        <div class="section-label">LEGAL NAME</div>
        <q-input v-model="form.legalName" :disable="!editable" dense filled />
      </div>

      <div class="col-12 col-md-6">
        <div class="section-label">ALIAS</div>
        <q-input v-model="form.alias" :disable="!editable" dense filled />
      </div>

      <div class="col-12 col-md-6">
        <div class="section-label">TAX ID</div>
        <q-input
          v-model.number="form.taxIdentificationNumber"
          type="text"
          :disable="!editable"
          dense
          filled
        />
      </div>

      <div class="col-12">
        <div class="section-label">EMAIL</div>
        <q-input v-model="form.email" type="email" :disable="!editable" dense filled />
      </div>

      <div class="col-12 col-md-6">
        <div class="section-label">PHONE NUMBER 1</div>
        <q-input v-model="form.phoneNumber1" :disable="!editable" dense filled />
      </div>

      <div class="col-12 col-md-6">
        <div class="section-label">PHONE NUMBER 2</div>
        <q-input v-model="form.phoneNumber2" :disable="!editable" dense filled />
      </div>

      <div class="col-12 col-md-6">
        <div class="section-label">STREET</div>
        <q-input v-model="form.street" :disable="!editable" dense filled />
      </div>
    </div>

    <div v-if="editable" class="row justify-end q-mt-lg">
      <q-btn
        label="Save Changes"
        color="primary"
        type="submit"
        unelevated
        rounded
        :loading="loading"
      />
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import type { Organization } from '../../../stores/organization-store';

const props = defineProps<{
  org: Organization;
  editable: boolean;
}>();

const emit = defineEmits<{
  (e: 'update', payload: Organization): void;
}>();

const loading = ref(false);
const form = ref<Organization>({ ...props.org });

watch(
  () => props.org,
  (newOrg) => {
    form.value = { ...newOrg };
  },
  { deep: true },
);

const submitForm = () => {
  loading.value = true;
  emit('update', form.value);
  loading.value = false;
};
</script>

<style scoped>
.section-label {
  font-size: 10px;
  font-weight: bold;
  color: #999;
}
</style>
