<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md full-height">
      <!-- Left Column: Search and Role List -->
      <div class="col-3">
        <q-card flat class="full-height">
          <q-card-section class="search-section">
            <SearchRoles />
          </q-card-section>
          <q-card-section class="roles-section q-pt-none">
            <ViewRoles />
          </q-card-section>
        </q-card>
      </div>

      <!-- Middle Column: Role Permissions -->
      <div class="col-4">
        <q-card flat class="full-height">
          <q-card-section>
            <RolePermissions />
          </q-card-section>
        </q-card>
      </div>

      <!-- Right Column: Available Permissions -->
      <div class="col-5">
        <q-card flat class="full-height">
          <q-card-section>
            <AllPermissions />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoleStore } from '../../../stores/role-store';
import SearchRoles from './SearchRoles.vue';
import ViewRoles from './ViewRoles.vue';
import RolePermissions from './RolePermissions.vue';
import AllPermissions from './AllPermissions.vue';

const roleStore = useRoleStore();

onMounted(async () => {
  // Fetch roles and permissions on mount
  await Promise.all([
    roleStore.fetchRoles(),
    roleStore.fetchPermissions(),
  ]);
});
</script>

<style scoped>
.full-height {
  height: calc(100vh - 100px);
}

.full-height :deep(.q-card) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.full-height :deep(.q-card__section) {
  overflow-y: auto;
}

.full-height :deep(.search-section) {
  flex: 0 0 auto;
}

.full-height :deep(.roles-section) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
</style>

