<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      debounce="300"
      v-model="store.search"
      placeholder="Search relationships..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
      Add Relationship
    </q-btn>
  </q-card-section>

  <AddRelationship />
</template>

<script setup lang="ts">
import { watch } from 'vue';
import { useRelationshipStore } from '../../../stores/relationship-store';
import AddRelationship from './AddRelationship.vue';

const store = useRelationshipStore();

watch(
  () => store.search,
  async () => {
    await store.fetchRelationships();
  },
);
</script>
