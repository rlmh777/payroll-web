<template>
  <q-dialog v-model="isOpen" position="right" @hide="onClose">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Employee Status</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input
            v-model="form.name"
            label="Employee Status Name *"
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
import { useEmployeeStatusStore } from 'src/stores/employee-status-store';

const props = defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [employeeStatusId: number];
}>();

const $q = useQuasar();
const store = useEmployeeStatusStore();
const form = ref({ name: '' });

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

async function onSubmit() {
  if (!form.value.name.trim()) return;

  const created = await store.createEmployeeStatus(form.value.name);
  if (created) {
    $q.notify({ color: 'positive', position: 'top', message: 'Employee status created.' });
    emit('saved', created.id);
    onClose();
  } else if (store.error) {
    $q.notify({ color: 'negative', position: 'top', message: store.error });
  }
}

function onClose() {
  form.value.name = '';
  isOpen.value = false;
}

watch(isOpen, (open) => {
  if (open) form.value.name = '';
});
</script>

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 400px;
  height: 100vh;
}
</style>
