<template>
  <q-dialog v-model="isOpen" position="right" :maximized="false" @hide="onClose">
    <q-card class="add-locality-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add New Location</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Location Name *"
            outlined
            :rules="[(val) => !!val || 'Location name is required']"
            :disable="localityStore.isLoading"
          />

          <DistrictSelect
            v-model="form.districtId"
            :rules="[(val: string | null | undefined) => !!val || 'District is required']"
            :disable="localityStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="localityStore.isLoading"
            />
            <q-btn type="submit" label="Save" color="primary" :loading="localityStore.isLoading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useLocalityStore } from '../../stores/locality-store';
import { useDistrictStore } from '../../stores/district-store';
import DistrictSelect from './DistrictSelect.vue';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [localityId: string];
}>();

const localityStore = useLocalityStore();
const districtStore = useDistrictStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  districtId: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name || !form.value.districtId) {
    return;
  }

  const newLocality = await localityStore.createLocality(form.value.name, form.value.districtId);

  if (newLocality) {
    emit('saved', newLocality.id);
    onClose();
  }
};

const onClose = () => {
  form.value = {
    name: '',
    districtId: null,
  };
  isOpen.value = false;
};

// Fetch districts when dialog opens
watch(isOpen, async (newValue) => {
  if (newValue) {
    await districtStore.fetchDistricts({});
  }
});

onMounted(async () => {
  await districtStore.fetchDistricts({});
});
</script>

<style scoped>
.add-locality-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-locality-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
