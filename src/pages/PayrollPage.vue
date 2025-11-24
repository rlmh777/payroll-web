<template>
  <div class="q-pa-md">
    <h5>{{ title }}</h5>
  </div>
</template>
<script setup lang="ts">
defineProps({
  title: String,
});
</script>
