<template>
  <q-dialog :model-value="open" position="right" @update:model-value="onDialogUpdate">
    <AppDialogCard>
      <AppDialogHeader>
        <div class="text-h6">{{ isEdit ? 'Edit skill' : 'Add skill' }}</div>
      </AppDialogHeader>

      <AppDialogBody>
        <q-form @submit.prevent="save">
          <AppDialogForm>
            <div class="col-12">
              <q-input v-model="form.name" label="Skill *" dense outlined :disable="saving" />
            </div>
            <div class="col-12">
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
            </div>
            <div class="col-12">
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
            </div>
            <div class="col-12">
              <q-input v-model="form.notes" type="textarea" label="Notes" dense outlined :disable="saving" />
            </div>
          </AppDialogForm>
        </q-form>
      </AppDialogBody>

      <AppDialogActions>
        <q-btn flat label="Cancel" color="grey" :disable="saving" @click="close" />
        <q-btn color="primary" :loading="saving" label="Save" @click="save" />
      </AppDialogActions>
    </AppDialogCard>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import AppDialogActions from '@core/components/dialog/AppDialogActions.vue';
import AppDialogBody from '@core/components/dialog/AppDialogBody.vue';
import AppDialogCard from '@core/components/dialog/AppDialogCard.vue';
import AppDialogForm from '@core/components/dialog/AppDialogForm.vue';
import AppDialogHeader from '@core/components/dialog/AppDialogHeader.vue';
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
