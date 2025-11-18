<template>
    <div class="q-my-md">
        <q-input outlined v-model="searchName" placeholder="Search by name" dense >
            <template v-slot:append>
                <q-icon name="search" />
            </template>
        </q-input>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import type { Ref } from 'vue';
  import { useEmployeeStore } from '../../../stores/employee-store';
  
  const employeeStore = useEmployeeStore();

  const searchName = computed({
    get: () => employeeStore.searchName,
    set: (value: string) => employeeStore.searchName = value
  }) as Ref<string>;
  </script>
  