<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      v-model="store.search"
      dense
      debounce="300"
      placeholder="Search work sites..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn color="primary" icon="add" label="Add Work Site" @click="store.openCreateDialog()" />
  </q-card-section>

  <AddWorksite />
</template>

<script setup lang="ts">
import { useWorksiteStore } from 'src/stores/worksite-store';
import AddWorksite from './AddWorksite.vue';

const store = useWorksiteStore();
</script>
