<template>
  <q-badge
    :style="badgeStyle"
    class="document-tag-chip"
    :label="label"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { resolveDocumentTagColor } from 'src/stores/document-tag-store';

const props = withDefaults(defineProps<{
  label: string;
  color?: string | null;
}>(), {
  color: null,
});

const badgeStyle = computed(() => {
  const bg = resolveDocumentTagColor(props.color);
  return {
    backgroundColor: bg,
    color: '#fff',
  };
});
</script>

<style scoped>
.document-tag-chip {
  font-weight: 500;
  padding: 4px 8px;
}
</style>
