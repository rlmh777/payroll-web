<template>
  <q-card :class="cardClass">
    <slot />
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{
  modal?: boolean;
}>(), {
  modal: false,
});

const cardClass = computed(() => [
  'app-dialog-card',
  props.modal && 'app-dialog-card--modal',
]);
</script>
