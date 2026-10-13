<template>
  <div class="form-renderer q-gutter-md">
    <template v-for="field in fields" :key="field.id">
      <div v-if="field.type === 'section'" class="text-subtitle1 text-weight-medium q-mt-sm">
        {{ field.label }}
        <div v-if="field.help" class="text-caption text-grey-7">{{ field.help }}</div>
      </div>

      <q-input
        v-else-if="field.type === 'score' || field.type === 'number'"
        :model-value="numberValue(field.id)"
        outlined
        dense
        type="number"
        :min="field.min ?? undefined"
        :max="field.max ?? undefined"
        :label="labelFor(field)"
        :hint="scoreHint(field)"
        :disable="disable"
        :rules="rulesFor(field)"
        @update:model-value="setNumber(field, $event)"
      />

      <q-input
        v-else-if="field.type === 'text'"
        :model-value="stringValue(field.id)"
        outlined
        dense
        :label="labelFor(field)"
        :hint="field.help || undefined"
        :placeholder="field.placeholder || undefined"
        :disable="disable"
        :rules="rulesFor(field)"
        @update:model-value="setValue(field.id, $event)"
      />

      <q-input
        v-else-if="field.type === 'textarea'"
        :model-value="stringValue(field.id)"
        outlined
        dense
        type="textarea"
        autogrow
        :label="labelFor(field)"
        :hint="field.help || undefined"
        :placeholder="field.placeholder || undefined"
        :disable="disable"
        :rules="rulesFor(field)"
        @update:model-value="setValue(field.id, $event)"
      />

      <q-select
        v-else-if="field.type === 'select'"
        :model-value="stringValue(field.id) || null"
        outlined
        dense
        emit-value
        map-options
        :label="labelFor(field)"
        :hint="field.help || undefined"
        :options="selectOptions(field)"
        :disable="disable"
        :rules="rulesFor(field)"
        @update:model-value="setValue(field.id, $event)"
      />

      <div v-else-if="field.type === 'radio'">
        <div class="text-caption text-grey-7 q-mb-xs">{{ labelFor(field) }}</div>
        <q-option-group
          :model-value="stringValue(field.id)"
          :options="selectOptions(field)"
          color="primary"
          :disable="disable"
          @update:model-value="setValue(field.id, $event)"
        />
        <div v-if="field.help" class="text-caption text-grey-7">{{ field.help }}</div>
      </div>

      <q-toggle
        v-else-if="field.type === 'checkbox'"
        :model-value="Boolean(answers[field.id])"
        :label="labelFor(field)"
        :disable="disable"
        @update:model-value="setValue(field.id, $event)"
      />

      <q-input
        v-else-if="field.type === 'date'"
        :model-value="stringValue(field.id)"
        outlined
        dense
        type="date"
        :label="labelFor(field)"
        :hint="field.help || undefined"
        :disable="disable"
        :rules="rulesFor(field)"
        @update:model-value="setValue(field.id, $event)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { FormField, FormSchema } from '@hr/stores/form-template-store';

const props = defineProps<{
  schema: FormSchema;
  answers: Record<string, unknown>;
  disable?: boolean;
}>();

const emit = defineEmits<{
  'update:answers': [value: Record<string, unknown>];
}>();

const fields = computed(() => props.schema?.fields ?? []);

function labelFor(field: FormField) {
  return field.required ? `${field.label} *` : field.label;
}

function scoreHint(field: FormField) {
  const parts = [field.help, field.max != null ? `Max ${field.max}` : null, field.weight && field.weight !== 1 ? `Weight ${field.weight}` : null];
  return parts.filter(Boolean).join(' · ') || undefined;
}

function selectOptions(field: FormField) {
  return (field.options ?? []).map((option) => ({ label: option.label, value: option.value }));
}

function stringValue(id: string) {
  const value = props.answers[id];
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function numberValue(id: string) {
  const value = props.answers[id];
  return value == null || value === '' ? null : Number(value);
}

function setValue(id: string, value: unknown) {
  emit('update:answers', { ...props.answers, [id]: value });
}

function setNumber(field: FormField, value: string | number | null) {
  if (value === '' || value === null || value === undefined) {
    setValue(field.id, null);
    return;
  }
  setValue(field.id, Number(value));
}

function rulesFor(field: FormField) {
  if (!field.required || field.type === 'checkbox' || field.type === 'section') {
    return [];
  }
  return [(value: unknown) => (value !== null && value !== undefined && value !== '') || `${field.label} is required`];
}
</script>
