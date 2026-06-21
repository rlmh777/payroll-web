<template>
  <div class="roles-list-container">
    <q-list bordered separator>
      <q-item
        v-for="role in roles"
        :key="role.id"
        clickable
        v-ripple
        :active="selectedRole?.id === role.id"
        active-class="bg-primary text-white"
        @click="selectRole(role)"
      >
        <q-item-section>
          <q-item-label>{{ role.name }}</q-item-label>
          <q-item-label caption v-if="role.permissions">
            {{ role.permissions.length }} permission{{ role.permissions.length !== 1 ? 's' : '' }}
          </q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="roles.length === 0 && !isLoading">
        <q-item-section>
          <q-item-label class="text-grey">No roles found</q-item-label>
        </q-item-section>
      </q-item>
      <q-item v-if="isLoading">
        <q-item-section>
          <q-spinner color="primary" size="20px" />
        </q-item-section>
      </q-item>
    </q-list>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoleStore } from '../../../stores/role-store';
import type { Role } from '../../../stores/role-store';

const roleStore = useRoleStore();

const roles = computed(() => roleStore.roles);
const selectedRole = computed(() => roleStore.selectedRole);
const isLoading = computed(() => roleStore.isLoadingRoles);

const selectRole = async (role: Role) => {
  // Fetch full role details with permissions
  const fullRole = await roleStore.fetchRole(role.id);
  if (fullRole) {
    roleStore.setSelectedRole(fullRole);
  } else {
    roleStore.setSelectedRole(role);
  }
};
</script>

<style scoped>
.roles-list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.roles-list-container :deep(.q-list) {
  flex: 1;
  overflow-y: auto;
}
</style>

