<template>
  <q-page class="q-pa-md">
    <div class="row q-col-gutter-md full-height">
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

      <div class="col-9">
        <q-card flat class="full-height">
          <q-card-section class="q-pb-none">
            <q-tabs v-model="activePanel" dense align="left" class="text-primary">
              <q-tab name="permissions" label="Permissions" icon="security" />
              <q-tab name="employee-form" label="Employee form" icon="badge" />
            </q-tabs>
            <q-separator />
          </q-card-section>

          <q-card-section class="panel-section">
            <div v-if="activePanel === 'permissions'" class="row q-col-gutter-md full-panel">
              <div class="col-5">
                <RolePermissions />
              </div>
              <div class="col-7">
                <AllPermissions />
              </div>
            </div>
            <RoleEmployeeFormAccess v-else />
          </q-card-section>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoleStore } from '../../stores/role-store';
import SearchRoles from './SearchRoles.vue';
import ViewRoles from './ViewRoles.vue';
import RolePermissions from './RolePermissions.vue';
import AllPermissions from './AllPermissions.vue';
import RoleEmployeeFormAccess from './RoleEmployeeFormAccess.vue';

const roleStore = useRoleStore();
const activePanel = ref<'permissions' | 'employee-form'>('permissions');

onMounted(async () => {
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

.full-height :deep(.search-section) {
  flex: 0 0 auto;
}

.full-height :deep(.roles-section) {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.full-height :deep(.panel-section) {
  flex: 1 1 auto;
  overflow-y: auto;
  min-height: 0;
}

.full-panel {
  min-height: 100%;
}
</style>
