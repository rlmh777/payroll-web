<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit SS Benefit Type</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.name"
            label="Benefit Type Name *"
            dense
            outlined
            :rules="[(val) => !!val || 'Name is required']"
            :disable="store.isLoading"
          />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="store.isLoading" @click="onClose" />
            <q-btn type="submit" color="primary" label="Save" :loading="store.isLoading" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useSsBenefitTypeStore, type SsBenefitType } from 'src/stores/ss-benefit-type-store';

const props = defineProps<{
  modelValue: boolean;
  benefitType: SsBenefitType | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [];
}>();

const $q = useQuasar();
const store = useSsBenefitTypeStore();
const form = ref({ name: '' });

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(
  () => props.benefitType,
  (type) => {
    form.value.name = type?.name ?? '';
  },
  { immediate: true },
);

async function onSubmit() {
  if (!props.benefitType || !form.value.name.trim()) return;

  const updated = await store.updateBenefitType(props.benefitType.id, form.value.name);
  if (updated) {
    $q.notify({ color: 'positive', position: 'top', message: 'Benefit type updated.' });
    emit('updated');
    onClose();
  } else if (store.error) {
    $q.notify({ color: 'negative', position: 'top', message: store.error });
  }
}

function onClose() {
  isOpen.value = false;
}
</script>

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 400px;
  height: 100vh;
}
</style>
