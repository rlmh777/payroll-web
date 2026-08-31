<template>
  <q-card-section class="app-dialog-header row items-center">
    <slot />
    <q-space />
    <slot name="close">
      <q-btn v-if="showClose" icon="close" flat round dense v-close-popup />
    </slot>
  </q-card-section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  showClose?: boolean;
}>(), {
  showClose: true,
});
</script>
