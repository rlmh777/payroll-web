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
        <q-select
          v-model="searchFilters.state"
          :options="stateOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="State"
          clearable
          @update:model-value="onSearch"
        />
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
          label="Add Weekly Record"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddWeeklyRecord
      v-model="showAddDialog"
      @saved="onRecordSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSocialSecurityStore } from '../../../stores/social-security-store';
import AddWeeklyRecord from './AddWeeklyRecord.vue';

const socialSecurityStore = useSocialSecurityStore();

const stateOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const searchFilters = computed({
  get: () => socialSecurityStore.searchFilters,
  set: (value) => {
    socialSecurityStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.state !== null
  );
});

const onSearch = async () => {
  await socialSecurityStore.fetchSocialSecurities();
};

const clearFilters = async () => {
  socialSecurityStore.searchFilters = {
    search: null,
    state: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onRecordSaved = async () => {
  // Refresh the list after a new record is added
  await socialSecurityStore.fetchSocialSecurities();
};
</script>

<style scoped>
</style>

