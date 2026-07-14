<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-3">
        <q-input
          v-model="searchFilters.search"
          label="Search by Name"
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
          v-model="searchFilters.status"
          :options="statusOptions"
          label="Status"
          outlined
          dense
          clearable
          emit-value
          map-options
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
          label="Add Pay Period Group"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddPayPeriodGroup
      v-model="showAddDialog"
      @saved="onRecordSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { usePayPeriodGroupStore } from '@/stores/pay-period-group-store';
import AddPayPeriodGroup from './AddPayPeriodGroup.vue';

const payPeriodGroupStore = usePayPeriodGroupStore();

const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
];

const searchFilters = computed({
  get: () => payPeriodGroupStore.searchFilters,
  set: (value) => {
    payPeriodGroupStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(searchFilters.value.search || searchFilters.value.status);
});

const onSearch = async () => {
  await payPeriodGroupStore.fetchPayPeriodGroups();
};

const clearFilters = async () => {
  payPeriodGroupStore.searchFilters = {
    search: null,
    status: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onRecordSaved = async () => {
  // Refresh the list after a new record is added
  await payPeriodGroupStore.fetchPayPeriodGroups();
};
</script>

<style scoped>
</style>
