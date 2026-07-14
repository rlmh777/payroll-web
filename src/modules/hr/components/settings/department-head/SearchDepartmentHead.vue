<template>
  <div class="row items-center q-col-gutter-md q-mb-md">
    <div class="col-12 col-md-4">
      <q-input
        v-model="searchQuery"
        outlined
        dense
        clearable
        placeholder="Search department or employee"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>
    </div>
    <div class="col-12 col-md-4">
      <DepartmentSelect
        v-model="departmentFilter"
        label="Department"
        clearable
      />
    </div>
    <div class="col-12 col-md-2">
      <q-toggle
        v-model="currentOnly"
        label="Current only"
        dense
      />
    </div>
    <div class="col-12 col-md-2 text-right">
      <q-btn color="primary" icon="add" label="Appoint head" dense @click="store.openCreateDialog()" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import DepartmentSelect from '@hr/components/department/DepartmentSelect.vue';
import { useDepartmentHeadStore } from 'src/stores/department-head-store';

const store = useDepartmentHeadStore();

const searchQuery = computed({
  get: () => store.search,
  set: (value: string | null) => {
    store.search = value ?? '';
  },
});

const departmentFilter = computed({
  get: () => store.filterDepartmentId,
  set: (value: number | null) => {
    store.filterDepartmentId = value;
  },
});

const currentOnly = computed({
  get: () => store.filterCurrentOnly,
  set: (value: boolean) => {
    store.filterCurrentOnly = value;
  },
});
</script>
