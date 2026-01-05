<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-district-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit District</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            :rules="[val => !!val || 'Name is required']"
            :disable="districtStore.isLoading"
          />

          <CountrySelect
            v-model="form.countryId"
            :rules="[(val: string | null | undefined) => !!val || 'Country is required']"
            :disable="districtStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="districtStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="districtStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useDistrictStore } from '../../stores/district-store';
import type { District } from '../models';
import CountrySelect from './CountrySelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  district: District | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  district: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [districtId: string];
}>();

const districtStore = useDistrictStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  countryId: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name || !form.value.countryId || !props.district) {
    return;
  }

  try {
    const updatedDistrict = await districtStore.updateDistrict(
      props.district.id,
      form.value.name,
      form.value.countryId
    );

    if (updatedDistrict) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'District updated successfully!',
      });
      emit('updated', updatedDistrict.id);
      onClose();
    } else if (districtStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: districtStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update district';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load district data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.district) {
    // Populate form with existing data
    form.value = {
      name: props.district.name || '',
      countryId: props.district.countryId || null,
    };
  }
});
</script>

<style scoped>
.edit-district-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-district-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

