<template>
  <q-form class="app-dialog-form row q-col-gutter-md" @submit.prevent="$emit('submit')">
    <div class="col-12">
      <q-input
        :model-value="modelValue.name"
        label="Work site name *"
        outlined
        dense
        :rules="[(value) => !!value || 'Name is required']"
        :disable="saving"
        @update:model-value="updateField('name', String($event ?? ''))"
      />
    </div>

    <div class="col-12">
      <q-input
        :model-value="modelValue.address1"
        label="Address line 1 *"
        outlined
        dense
        :rules="[(value) => !!value || 'Address line 1 is required']"
        :disable="saving"
        @update:model-value="updateField('address1', String($event ?? ''))"
      />
    </div>

    <div class="col-12">
      <q-input
        :model-value="modelValue.address2 ?? ''"
        label="Address line 2"
        outlined
        dense
        :disable="saving"
        @update:model-value="updateField('address2', String($event ?? '') || null)"
      />
    </div>

    <div class="col-12">
      <q-select
        :model-value="modelValue.localityId"
        :options="localityOptions"
        option-value="id"
        option-label="label"
        emit-value
        map-options
        use-input
        input-debounce="0"
        label="Locality *"
        outlined
        dense
        :loading="localityLoading"
        :disable="saving"
        :rules="[(value) => !!value || 'Locality is required']"
        @filter="filterLocalities"
        @update:model-value="updateField('localityId', String($event ?? ''))"
      />
    </div>

    <div v-if="showActions" class="col-12">
      <div class="row justify-end q-gutter-sm app-dialog-form-actions">
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="$emit('cancel')" />
        <q-btn type="submit" color="primary" :label="submitLabel" :loading="saving" />
      </div>
    </div>
  </q-form>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { WorksitePayload } from 'src/stores/worksite-store';

const props = withDefaults(
  defineProps<{
    modelValue: WorksitePayload;
    localities: Array<{ id: string; name?: string; district?: { name?: string; country?: { name?: string } } }>;
    localityLoading?: boolean;
    saving?: boolean;
    submitLabel?: string;
    showActions?: boolean;
  }>(),
  {
    localityLoading: false,
    saving: false,
    submitLabel: 'Save',
    showActions: true,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: WorksitePayload];
  submit: [];
  cancel: [];
}>();

const localityFilter = ref('');

const localityOptions = computed(() => {
  const search = localityFilter.value.trim().toLowerCase();

  return props.localities
    .filter((locality) => {
      if (!search) {
        return true;
      }

      const localityName = locality.name?.toLowerCase() ?? '';
      const districtName = locality.district?.name?.toLowerCase() ?? '';
      const countryName = locality.district?.country?.name?.toLowerCase() ?? '';

      return (
        localityName.includes(search) ||
        districtName.includes(search) ||
        countryName.includes(search)
      );
    })
    .map((locality) => ({
      id: locality.id,
      label: [locality.name, locality.district?.name, locality.district?.country?.name]
        .filter(Boolean)
        .join(', '),
    }));
});

function filterLocalities(value: string, update: (callback: () => void) => void) {
  update(() => {
    localityFilter.value = value;
  });
}

function updateField<Key extends keyof WorksitePayload>(key: Key, value: WorksitePayload[Key]) {
  emit('update:modelValue', {
    ...props.modelValue,
    [key]: value,
  });
}
</script>
