<template>
  <div v-if="visibleFields.length > 0" class="row q-gutter-x-lg q-gutter-y-md">
    <div
      v-for="field in visibleFields"
      :key="field.key"
      :class="field.input_type === 'textarea' ? 'col-12' : 'col-12 col-md-4'"
    >
      <q-input
        v-if="field.input_type === 'textarea'"
        :model-value="stringValue(field.key)"
        :label="fieldLabel(field)"
        :hint="field.help_text || undefined"
        :readonly="isReadonly(field.key)"
        type="textarea"
        autogrow
        outlined
        dense
        @update:model-value="setValue(field.key, $event)"
      />
      <q-input
        v-else-if="field.input_type === 'number'"
        :model-value="stringValue(field.key)"
        :label="fieldLabel(field)"
        :hint="field.help_text || undefined"
        :readonly="isReadonly(field.key)"
        type="number"
        outlined
        dense
        @update:model-value="setValue(field.key, $event === '' || $event == null ? null : Number($event))"
      />
      <DateField
        v-else-if="field.input_type === 'date'"
        :model-value="stringValue(field.key) || null"
        :label="fieldLabel(field)"
        :disable="isReadonly(field.key)"
        clearable
        @update:model-value="setValue(field.key, $event)"
      />
      <q-select
        v-else-if="field.input_type === 'select'"
        :model-value="stringValue(field.key) || null"
        :options="field.options || []"
        option-label="label"
        option-value="value"
        emit-value
        map-options
        :label="fieldLabel(field)"
        :hint="field.help_text || undefined"
        :readonly="isReadonly(field.key)"
        clearable
        outlined
        dense
        @update:model-value="setValue(field.key, $event ?? null)"
      />
      <q-toggle
        v-else-if="field.input_type === 'toggle'"
        :model-value="booleanValue(field.key)"
        :label="fieldLabel(field)"
        :disable="isReadonly(field.key)"
        @update:model-value="setValue(field.key, $event)"
      />
      <q-input
        v-else
        :model-value="stringValue(field.key)"
        :label="fieldLabel(field)"
        :hint="field.help_text || undefined"
        :readonly="isReadonly(field.key)"
        outlined
        dense
        @update:model-value="setValue(field.key, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import DateField from '@core/components/common/DateField.vue';
import { useEmployeeFormAccess } from '@core/composables/useEmployeeFormAccess';
import type { EmployeeFormFieldCatalogItem } from '@core/types/employee-form-access';
import { useEmployeeStore } from '@hr/stores/employee-store';
import { useEmployeeFormFieldStore } from '@hr/stores/employee-form-field-store';

const props = defineProps<{
  tab: string;
}>();

const employeeStore = useEmployeeStore();
const catalogStore = useEmployeeFormFieldStore();
const { isFieldVisible, isFieldReadonly, canWriteField } = useEmployeeFormAccess();
const isCreating = computed(() => !employeeStore.selectedEmployee?.id);

const visibleFields = computed(() =>
  catalogStore.fieldsForTab(props.tab).filter((field) => isFieldVisible(field.key)),
);

function fieldLabel(field: EmployeeFormFieldCatalogItem): string {
  return field.is_required ? `${field.label} *` : field.label;
}

function isReadonly(key: string): boolean {
  return isFieldReadonly(key, isCreating.value);
}

function attributes(): Record<string, unknown> {
  const employee = employeeStore.selectedEmployee;
  if (!employee) {
    return {};
  }
  if (!employee.customAttributes || typeof employee.customAttributes !== 'object') {
    employee.customAttributes = {};
  }
  return employee.customAttributes;
}

function stringValue(key: string): string {
  const value = attributes()[key];
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }
  return '';
}

function booleanValue(key: string): boolean {
  return Boolean(attributes()[key]);
}

function setValue(key: string, value: unknown) {
  if (!employeeStore.selectedEmployee || !canWriteField(key, isCreating.value)) {
    return;
  }
  const bag = attributes();
  bag[key] = value;
}

onMounted(() => {
  if (catalogStore.fields.length === 0 && !catalogStore.isLoading) {
    void catalogStore.fetchCatalog();
  }
});
</script>
