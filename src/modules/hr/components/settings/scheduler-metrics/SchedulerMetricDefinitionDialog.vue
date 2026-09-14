<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 420px; max-width: 520px">
      <q-card-section>
        <div class="text-h6">{{ record ? 'Edit metric' : 'Add metric' }}</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Metrics enabled here appear as an optional row under the scheduler day headers.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-input
            v-model="form.name"
            label="Name"
            outlined
            dense
            :rules="[(v) => !!String(v || '').trim() || 'Name is required']"
          />
          <q-input
            v-model="form.code"
            label="Code"
            hint="Lowercase letters, numbers, and underscores. Example: guests"
            outlined
            dense
            :disable="!!record"
            :rules="[
              (v) => !!String(v || '').trim() || 'Code is required',
              (v) => /^[a-z][a-z0-9_]*$/.test(String(v || '')) || 'Use a lowercase code like guests',
            ]"
          />
          <q-input
            v-model="form.short_label"
            label="Short label"
            hint="Shown in the scheduler header cells"
            outlined
            dense
          />
          <q-select
            v-model="form.value_type"
            :options="valueTypeOptions"
            emit-value
            map-options
            label="Value type"
            outlined
            dense
          />
          <q-input
            v-model.number="form.sort_order"
            type="number"
            min="0"
            step="1"
            label="Sort order"
            outlined
            dense
          />
          <q-toggle v-model="form.is_active" label="Show on scheduler" color="primary" />

          <div class="row justify-end q-gutter-sm">
            <q-btn flat label="Cancel" :disable="saving" @click="emit('update:modelValue', false)" />
            <q-btn color="primary" type="submit" label="Save" :loading="saving" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import {
  useSchedulerMetricStore,
  type SchedulerMetricDefinition,
  type SchedulerMetricValueType,
} from '@hr/stores/scheduler-metric-store';

const props = defineProps<{
  modelValue: boolean;
  record?: SchedulerMetricDefinition | null;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void;
  (event: 'saved'): void;
}>();

const $q = useQuasar();
const store = useSchedulerMetricStore();
const saving = ref(false);

const valueTypeOptions = [
  { label: 'Whole number', value: 'integer' },
  { label: 'Decimal', value: 'decimal' },
];

const form = reactive({
  name: '',
  code: '',
  short_label: '',
  value_type: 'integer' as SchedulerMetricValueType,
  sort_order: 0,
  is_active: false,
});

function resetForm() {
  form.name = props.record?.name ?? '';
  form.code = props.record?.code ?? '';
  form.short_label = props.record?.short_label ?? '';
  form.value_type = props.record?.value_type ?? 'integer';
  form.sort_order = props.record?.sort_order ?? 0;
  form.is_active = props.record?.is_active ?? false;
}

watch(
  () => [props.modelValue, props.record] as const,
  ([open]) => {
    if (open) {
      resetForm();
    }
  },
);

async function save() {
  saving.value = true;
  try {
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toLowerCase(),
      short_label: form.short_label.trim() || null,
      value_type: form.value_type,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };

    if (props.record) {
      await store.updateDefinition(props.record.id, payload);
      $q.notify({ type: 'positive', message: 'Metric updated' });
    } else {
      await store.createDefinition(payload);
      $q.notify({ type: 'positive', message: 'Metric created' });
    }

    emit('saved');
    emit('update:modelValue', false);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save metric',
    });
  } finally {
    saving.value = false;
  }
}
</script>
