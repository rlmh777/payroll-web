<template>
  <div>
    <div class="row q-gutter-md items-center q-mb-md">
      <div class="col-12 col-md-8">
        <q-input
          v-model="searchTerm"
          label="Search Permissions"
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
          label="Add Permission"
          icon="add"
          @click="showAddDialog = true"
        />
      </div>
    </div>
    <AddPermission
      v-model="showAddDialog"
      @saved="onPermissionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoleStore } from '../../stores/role-store';
import AddPermission from './AddPermission.vue';

const roleStore = useRoleStore();

const searchTerm = ref<string>('');
const showAddDialog = ref<boolean>(false);

const onSearch = async () => {
  await roleStore.fetchPermissions(searchTerm.value || undefined);
};

const onPermissionSaved = async () => {
  // Refresh the permissions list after a new permission is added
  await roleStore.fetchPermissions(searchTerm.value || undefined);
};
</script>

<style scoped>
</style>

