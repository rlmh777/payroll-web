<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-3">
        <q-input
          v-model="searchFilters.search"
          label="Search by Range"
          outlined
          dense
          clearable
          @update:model-value="onSearch"
        >
          <template v-slot:append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-md-2">
        <q-btn
          flat
          label="Clear Filters"
          color="grey"
          @click="clearFilters"
          :disable="!hasActiveFilters"
        />
      </div>
      <q-space />
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Add Personal Relief"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddPersonalRelief
      v-model="showAddDialog"
      @saved="onRecordSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePersonalReliefStore } from '../../../stores/personal-relief-store';
import AddPersonalRelief from './AddPersonalRelief.vue';

const personalReliefStore = usePersonalReliefStore();

const searchFilters = computed({
  get: () => personalReliefStore.searchFilters,
  set: (value) => {
    personalReliefStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(searchFilters.value.search);
});

const onSearch = async () => {
  await personalReliefStore.fetchPersonalReliefs();
};

const clearFilters = async () => {
  personalReliefStore.searchFilters = {
    search: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onRecordSaved = async () => {
  // Refresh the list after a new record is added
  await personalReliefStore.fetchPersonalReliefs();
};
</script>

<style scoped>
</style>

