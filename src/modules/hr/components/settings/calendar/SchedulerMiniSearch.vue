<template>
  <div class="scheduler-mini-search">
    <div class="text-subtitle2 text-weight-medium q-mb-xs">Search employees</div>
    <q-input
      v-model="searchQuery"
      outlined
      dense
      clearable
      placeholder="Name or employee code"
    >
      <template #prepend>
        <q-icon name="search" />
      </template>
    </q-input>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSchedulerStore } from '@hr/stores/scheduler-store';

const schedulerStore = useSchedulerStore();

const searchQuery = computed({
  get: () => schedulerStore.employeeSearch,
  set: (value: string | null) => schedulerStore.setEmployeeSearch(value ?? ''),
});
</script>

<style scoped>
.scheduler-mini-search {
  padding-top: 8px;
}
</style>
