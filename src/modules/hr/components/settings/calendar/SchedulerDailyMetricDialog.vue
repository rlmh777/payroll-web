<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 360px; max-width: 440px">
      <q-card-section>
        <div class="text-h6">Daily metrics</div>
        <div class="text-body2 text-grey-7 q-mt-xs">{{ formattedDate }}</div>
      </q-card-section>

      <q-separator />

      <q-card-section class="q-gutter-md">
        <q-input
          v-for="definition in definitions"
          :key="definition.id"
          v-model="formValues[String(definition.id)]"
          :label="definition.name"
          :hint="definition.short_label || undefined"
          type="number"
          :step="definition.value_type === 'integer' ? '1' : '0.01'"
          outlined
          dense
          clearable
        />
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" :disable="saving" @click="emit('update:modelValue', false)" />
        <q-btn color="primary" label="Save" :loading="saving" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { date, useQuasar } from 'quasar';
import {
  useSchedulerMetricStore,
  type SchedulerMetricDefinition,
} from '@hr/stores/scheduler-metric-store';

const props = defineProps<{
  modelValue: boolean;
  day: string | null;
  definitions: SchedulerMetricDefinition[];
  values?: Record<string, number | null>;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'saved'): void;
}>();

const $q = useQuasar();
const store = useSchedulerMetricStore();
const saving = ref(false);
const formValues = reactive<Record<string, string>>({});

const formattedDate = computed(() => {
  if (!props.day) {
    return '';
  }
  return date.formatDate(props.day, 'dddd, MMM D YYYY');
});

function resetForm() {
  for (const key of Object.keys(formValues)) {
    delete formValues[key];
  }

  for (const definition of props.definitions) {
    const key = String(definition.id);
    const value = props.values?.[key];
    formValues[key] = value == null ? '' : String(value);
  }
}

watch(
  () => [props.modelValue, props.day, props.definitions, props.values] as const,
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
);

async function save() {
  if (!props.day) {
    return;
  }

  const payload: Record<string, number | null> = {};
  for (const definition of props.definitions) {
    const key = String(definition.id);
    const raw = formValues[key];
    if (raw == null || String(raw).trim() === '') {
      payload[key] = null;
      continue;
    }

    const number = Number(raw);
    if (Number.isNaN(number)) {
      $q.notify({ type: 'negative', message: `Invalid value for ${definition.name}` });
      return;
    }

    payload[key] = definition.value_type === 'integer' ? Math.round(number) : number;
  }

  saving.value = true;
  try {
    await store.upsertDailyMetrics(props.day, payload);
    $q.notify({ type: 'positive', message: 'Daily metrics saved' });
    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save daily metrics',
    });
  } finally {
    saving.value = false;
  }
}
</script>
