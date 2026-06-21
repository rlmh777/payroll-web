<template>
  <div>
    <div class="row q-gutter-md items-center">
      <div class="col-12 col-md-11">
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
      <q-space />
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Add Role"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddRole
      v-model="showAddDialog"
      @saved="onRoleSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoleStore } from '../../../stores/role-store';
import AddRole from './AddRole.vue';

const roleStore = useRoleStore();

const searchFilters = computed({
  get: () => roleStore.searchFilters,
  set: (value) => {
    roleStore.searchFilters = value;
  },
});

const onSearch = async () => {
  await roleStore.fetchRoles();
};

const showAddDialog = ref<boolean>(false);

const onRoleSaved = async () => {
  // Refresh the list after a new role is added
  await roleStore.fetchRoles();
};
</script>

<style scoped>
</style>

