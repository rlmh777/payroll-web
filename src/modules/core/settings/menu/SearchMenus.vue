<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-3">
        <q-input
          v-model="searchFilters.search"
          label="Search by Title"
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
          v-model="searchFilters.type"
          :options="typeOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="Type"
          clearable
          @update:model-value="onSearch"
        />
      </div>
      <div class="col-12 col-md-2">
        <q-select
          v-model="searchFilters.is_active"
          :options="activeOptions"
          option-value="value"
          option-label="label"
          emit-value
          map-options
          outlined
          dense
          label="Status"
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
          label="Add Menu"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddMenu
      v-model="showAddDialog"
      @saved="onMenuSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useMenuStore } from '../../stores/menu-store';
import { useMenuStore as useNavigationMenuStore } from '../../stores/menus';
import AddMenu from './AddMenu.vue';

const menuStore = useMenuStore();
const navigationMenuStore = useNavigationMenuStore();

const typeOptions = [
  { value: 'menu', label: 'Menu' },
  { value: 'submenu', label: 'Submenu' },
];

const activeOptions = [
  { value: true, label: 'Active' },
  { value: false, label: 'Inactive' },
];

const searchFilters = computed({
  get: () => menuStore.searchFilters,
  set: (value) => {
    menuStore.searchFilters = value;
  },
});

const hasActiveFilters = computed(() => {
  return !!(
    searchFilters.value.search ||
    searchFilters.value.type !== null ||
    searchFilters.value.is_active !== null
  );
});

const onSearch = async () => {
  await menuStore.fetchMenus();
};

const clearFilters = async () => {
  menuStore.searchFilters = {
    search: null,
    type: null,
    parent_id: null,
    is_active: null,
  };
  await onSearch();
};

const showAddDialog = ref<boolean>(false);

const onMenuSaved = async () => {
  // Refresh the list after a new menu is added
  await menuStore.fetchMenus();
  // Refresh the navigation menu (header and drawer)
  await navigationMenuStore.fetchMenus();
  // Close add dialog
  showAddDialog.value = false;
};
</script>

<style scoped>
</style>

