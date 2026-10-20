<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      dense
      outlined
      debounce="300"
      v-model="store.search"
      placeholder="Search genders..."
      clearable
      class="col-grow"
    />
    <q-btn color="primary" icon="add" label="Add Gender" @click="store.openCreateDialog()" />
  </q-card-section>

  <AddGender />
</template>

<script setup lang="ts">
import { useGenderStore } from '@core/stores/gender-store';
import AddGender from './AddGender.vue';

const store = useGenderStore();
</script>
