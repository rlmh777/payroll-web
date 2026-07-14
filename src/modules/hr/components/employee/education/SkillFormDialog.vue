<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <q-card class="drawer-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ isEdit ? 'Edit skill' : 'Add skill' }}</div>
        <q-space />
        <q-btn icon="close" flat round dense :disable="saving" @click="close" />
      </q-card-section>
      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input v-model="form.name" label="Skill *" dense outlined :disable="saving" />
          <q-select
            v-model="form.proficiencyLevel"
            :options="proficiencyOptions"
            emit-value
            map-options
            outlined
            dense
            clearable
            label="Proficiency"
            :disable="saving"
          />
          <q-input
            v-model.number="form.yearsExperience"
            type="number"
            min="0"
            step="0.5"
            label="Years of experience"
            dense
            outlined
            :disable="saving"
          />
          <q-input v-model="form.notes" type="textarea" label="Notes" dense outlined :disable="saving" />
          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
            <q-btn type="submit" color="primary" :loading="saving" label="Save" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  PROFICIENCY_LEVELS,
  useEmployeeSkillStore,
  type EmployeeSkill,
} from 'src/stores/employee-skill-store';

const props = defineProps<{
  employeeId: string;
  modelValue: boolean;
  record?: EmployeeSkill | null;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [];
}>();

const $q = useQuasar();
const store = useEmployeeSkillStore();
const saving = ref(false);
const proficiencyOptions = [...PROFICIENCY_LEVELS];

const isEdit = computed(() => Boolean(props.record?.id));

const open = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const form = reactive({
  name: '',
  proficiencyLevel: null as string | null,
  yearsExperience: null as number | null,
  notes: '',
});

watch(
  () => props.record,
  (record) => {
    form.name = record?.name ?? '';
    form.proficiencyLevel = record?.proficiencyLevel ?? null;
    form.yearsExperience = record?.yearsExperience ?? null;
    form.notes = record?.notes ?? '';
  },
  { immediate: true },
);

function onDialogUpdate(value: boolean) {
  open.value = value;
}

function close() {
  open.value = false;
}

async function save() {
  if (!form.name.trim()) {
    $q.notify({ color: 'negative', position: 'top', message: 'Skill name is required.' });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      employeeId: props.employeeId,
      name: form.name.trim(),
      proficiencyLevel: form.proficiencyLevel || null,
      yearsExperience: form.yearsExperience ?? null,
      notes: form.notes || null,
    };

    if (isEdit.value && props.record) {
      await store.updateRecord(props.record.id, payload);
    } else {
      await store.createRecord(payload);
    }

    $q.notify({ color: 'positive', position: 'top', message: 'Skill saved.' });
    emit('saved');
    close();
  } catch (error) {
    $q.notify({
      color: 'negative',
      position: 'top',
      message: error instanceof Error ? error.message : 'Save failed.',
    });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped>
.drawer-card {
  width: 30vw;
  max-width: 420px;
  height: 100vh;
}
</style>
