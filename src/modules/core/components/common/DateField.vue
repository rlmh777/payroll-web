<template>
  <q-input
    :model-value="quasarDate"
    :label="label"
    outlined
    dense
    :stack-label="stackLabel"
    :clearable="clearable"
    :disable="disable"
    mask="date"
    :rules="allRules"
    @update:model-value="onInputUpdate"
  >
    <template #append>
      <q-icon name="event" class="cursor-pointer">
        <q-popup-proxy cover transition-show="scale" transition-hide="scale">
          <q-date :model-value="quasarDate" @update:model-value="onDateUpdate">
            <div class="row items-center justify-end">
              <q-btn v-close-popup label="Close" color="primary" flat />
            </div>
          </q-date>
        </q-popup-proxy>
      </q-icon>
    </template>
  </q-input>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { ValidationRule } from 'quasar';

/** Custom rules receive API format (YYYY-MM-DD), not Quasar slash format. */
export type DateFieldRule = (val: string | null) => boolean | string;

const props = withDefaults(defineProps<{
  modelValue: string | null;
  label: string;
  disable?: boolean;
  clearable?: boolean;
  required?: boolean;
  stackLabel?: boolean;
  rules?: DateFieldRule[];
}>(), {
  disable: false,
  clearable: false,
  required: false,
  stackLabel: false,
  rules: () => [],
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const quasarDate = computed(() => toQuasarDate(props.modelValue));

const allRules = computed((): ValidationRule[] => {
  const customRules = (props.rules ?? []).map(toValidationRule);
  if (!props.required) {
    return customRules;
  }
  return [
    toValidationRule((val) => !!val || `${props.label} is required`),
    ...customRules,
  ];
});

function toQuasarDate(value: string | null): string {
  if (!value) return '';
  return value.includes('/') ? value : value.replace(/-/g, '/');
}

function toApiDate(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.replace(/\//g, '-');
}

function toValidationRule(rule: DateFieldRule): ValidationRule {
  return (val: unknown) => rule(toApiDate(val as string | null));
}

function onInputUpdate(value: string | null | number) {
  const stringValue = value === null || value === undefined ? '' : String(value);
  emit('update:modelValue', toApiDate(stringValue || null));
}

function onDateUpdate(value: string | null) {
  emit('update:modelValue', toApiDate(value));
}
</script>
