<template>
  <q-select
    :model-value="modelValue"
    :options="options"
    :label="label"
    outlined
    dense
    clearable
    emit-value
    map-options
    :loading="groupStore.isLoading"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useEmployeeGroupStore } from '@hr/stores/employee-group-store';

defineProps<{
  modelValue: string | null;
  label?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string | null];
}>();

const groupStore = useEmployeeGroupStore();

const options = computed(() => groupStore.groupOptions);

onMounted(async () => {
  if (!groupStore.groups.length) {
    await groupStore.fetchGroups({ withMembers: false, activeOnly: true });
  }
});
</script>
