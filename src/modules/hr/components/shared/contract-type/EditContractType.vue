<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Contract Type</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section v-if="form">
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.name"
            label="Contract Type Name *"
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
import { useContractTypeStore, type ContractType } from 'src/stores/contract-type-store';

const props = defineProps<{
  modelValue: boolean;
  contractType: ContractType | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  updated: [];
}>();

const $q = useQuasar();
const store = useContractTypeStore();
const form = ref<{ id: number; name: string } | null>(null);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

watch(() => props.contractType, (item) => {
  form.value = item ? { id: item.id, name: item.name } : null;
}, { immediate: true });

async function onSubmit() {
  if (!form.value) return;

  const updated = await store.updateContractType(form.value.id, form.value.name);
  if (updated) {
    $q.notify({ color: 'positive', position: 'top', message: 'Contract type updated.' });
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
