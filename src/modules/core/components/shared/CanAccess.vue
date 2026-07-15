<template>
  <slot v-if="allowed" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { usePermissions } from '@core/composables/usePermissions';

const props = withDefaults(defineProps<{
  permission?: string | null;
  any?: string[];
  all?: string[];
}>(), {
  permission: null,
  any: () => [],
  all: () => [],
});

const { can, canAny, canAll } = usePermissions();

const allowed = computed(() => {
  if (props.permission) {
    return can(props.permission);
  }

  if (props.any.length > 0) {
    return canAny(props.any);
  }

  if (props.all.length > 0) {
    return canAll(props.all);
  }

  return true;
});
</script>
