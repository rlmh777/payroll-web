<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-district-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add New District</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="District Name *"
            outlined
            :rules="[val => !!val || 'District name is required']"
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
              label="Save"
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
import { computed, onBeforeMount, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { useDistrictStore } from '@core/stores/district-store';
import CountrySelect from './CountrySelect.vue';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [districtId: string];
}>();

const districtStore = useDistrictStore();
const { countries } = storeToRefs(districtStore);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  countryId: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name || !form.value.countryId) {
    return;
  }

  const newDistrict = await districtStore.createDistrict(
    form.value.name,
    form.value.countryId
  );

  if (newDistrict) {
    emit('saved', newDistrict.id);
    onClose();
  }
};

const onClose = () => {
  form.value = {
    name: '',
    countryId: null,
  };
  isOpen.value = false;
};

const setBelizeAsDefault = () => {
  const belize = countries.value.find(
    (country) => country.name?.toLowerCase() === 'belize'
  );
  if (belize) {
    form.value.countryId = belize.id;
  }
};

// Watch for countries to be loaded and set Belize as default when dialog is open
watch(countries, () => {
  if (isOpen.value && countries.value.length > 0) {
    setBelizeAsDefault();
  }
});

// Fetch countries when dialog opens and always set Belize as default
watch(isOpen, async (newValue) => {
  if (newValue) {
    // Reset form to ensure clean state
    form.value.name = '';
    form.value.countryId = null;
    
    await districtStore.fetchCountries('Be');
    // Set Belize as default country after countries are loaded
    setBelizeAsDefault();
  }
});

onBeforeMount(async () => {
  await districtStore.fetchCountries('Be');
});

onMounted(() => {
  setBelizeAsDefault();
});
</script>

<style scoped>
.add-district-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-district-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

