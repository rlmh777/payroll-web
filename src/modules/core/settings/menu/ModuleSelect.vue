<template>
  <q-select
    v-model="selectedModuleCode"
    :options="moduleOptions"
    option-value="code"
    option-label="label"
    emit-value
    map-options
    outlined
    :label="label"
    :disable="disable"
    :loading="moduleStore.loading"
    :rules="rules"
    :hint="hint"
  >
    <template v-if="moduleStore.loading" #prepend>
      <q-spinner color="primary" size="20px" />
    </template>
    <template #option="scope">
      <q-item v-bind="scope.itemProps">
        <q-item-section avatar>
          <q-icon :name="scope.opt.icon ?? 'widgets'" />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ scope.opt.title }}</q-item-label>
          <q-item-label caption>{{ scope.opt.code }}</q-item-label>
        </q-item-section>
      </q-item>
    </template>
  </q-select>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useModuleStore } from '../../stores/module-store';

const DEFAULT_MODULE = 'payroll';

const props = withDefaults(
  defineProps<{
    modelValue?: string | null;
    label?: string;
    disable?: boolean;
    hint?: string;
    rules?: Array<(value: string | null) => boolean | string>;
  }>(),
  {
    modelValue: DEFAULT_MODULE,
    label: 'Module',
    disable: false,
    hint: 'Module that owns this menu item',
    rules: () => [(value: string | null) => !!value || 'Module is required'],
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const moduleStore = useModuleStore();

const selectedModuleCode = computed({
  get: () => props.modelValue ?? DEFAULT_MODULE,
  set: (value) => emit('update:modelValue', value),
});

const moduleOptions = computed(() =>
  moduleStore.modules.map((module) => ({
    ...module,
    label: module.title,
  })),
);

onMounted(async () => {
  if (!moduleStore.modules.length) {
    await moduleStore.fetchModules();
  }
});
</script>
