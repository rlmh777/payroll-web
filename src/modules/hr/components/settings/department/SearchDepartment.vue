<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      v-model="store.search"
      dense
      debounce="300"
      placeholder="Search departments..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
      Add Department
    </q-btn>
  </q-card-section>

  <AddDepartment />
</template>

<script setup lang="ts">
import { useDepartmentStore } from '@hr/stores/department-store';
import AddDepartment from './AddDepartment.vue';

const store = useDepartmentStore();
</script>
