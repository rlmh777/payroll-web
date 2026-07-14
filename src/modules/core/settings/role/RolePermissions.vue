<template>
  <div>
    <div class="text-h6 q-mb-md">
      Role Permissions
      <q-chip v-if="selectedRole" color="primary" text-color="white" size="sm">
        {{ rolePermissions.length }}
      </q-chip>
    </div>
    <q-list bordered separator v-if="selectedRole">
      <q-item
        v-for="permission in rolePermissions"
        :key="permission.id"
      >
        <q-item-section>
          <q-item-label>{{ permission.name }}</q-item-label>
        </q-item-section>
        <q-item-section side>
          <q-btn
            flat
            round
            dense
            icon="remove_circle"
            color="negative"
            size="sm"
            @click="removePermission(permission.id)"
            :loading="roleStore.isLoading"
          >
            <q-tooltip>Remove Permission</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-item v-if="rolePermissions.length === 0">
        <q-item-section>
          <q-item-label class="text-grey">No permissions assigned</q-item-label>
        </q-item-section>
      </q-item>
    </q-list>
    <div v-else class="text-center q-pa-md text-grey">
      Select a role to view its permissions
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { useRoleStore } from '../../stores/role-store';
import type { Permission } from '../../stores/role-store';

const $q = useQuasar();
const roleStore = useRoleStore();

const selectedRole = computed(() => roleStore.selectedRole);
const rolePermissions = computed((): Permission[] => {
  return selectedRole.value?.permissions || [];
});

const removePermission = async (permissionId: string) => {
  if (!selectedRole.value) return;

  const success = await roleStore.removePermissionFromRole(
    selectedRole.value.id,
    permissionId
  );

  if (success) {
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Permission removed successfully!',
    });
    // Refresh role to get updated permissions
    await roleStore.fetchRole(selectedRole.value.id);
    // Refresh permissions list (preserve search term if any)
    await roleStore.fetchPermissions(roleStore.permissionSearch || undefined);
  } else {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: roleStore.error || 'Failed to remove permission',
    });
  }
};
</script>

<style scoped>
</style>

