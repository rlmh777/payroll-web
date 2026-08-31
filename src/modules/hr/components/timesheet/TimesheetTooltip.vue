<template>
  <q-tooltip
    anchor="top middle"
    self="bottom middle"
    class="bg-grey-9 text-body2"
    style="max-width: 320px; white-space: pre-line"
  >
    <slot>{{ text }}</slot>
  </q-tooltip>
</template>

<script setup lang="ts">
defineProps<{
  text?: string;
}>();
</script>
