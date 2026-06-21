<template>
  <div>
    <div class="text-h6 q-mb-md">
      Available Permissions
      <q-chip color="secondary" text-color="white" size="sm">
        {{ availablePermissions.length }}
      </q-chip>
    </div>
    <SearchPermissions />
    <div v-if="selectedRole" class="q-mt-md q-mb-sm row items-center q-gutter-sm">
      <q-btn
        flat
        dense
        :icon="allSelected ? 'deselect' : 'select_all'"
        :label="allSelected ? 'Deselect All' : 'Select All'"
        color="primary"
        @click="toggleSelectAll"
        :disable="availablePermissions.length === 0"
      />
      <q-btn
        v-if="selectedPermissions.length > 0"
        color="primary"
        label="Add Selected Permissions"
        icon="add"
        @click="addSelectedPermissions"
        :loading="roleStore.isLoading"
        :disable="selectedPermissions.length === 0"
      />
      <q-chip v-if="selectedPermissions.length > 0" color="primary" text-color="white" size="sm">
        {{ selectedPermissions.length }} selected
      </q-chip>
    </div>
    <q-list bordered separator class="q-mt-md">
      <q-item
        v-for="permission in availablePermissions"
        :key="permission.id"
      >
        <q-item-section avatar v-if="selectedRole">
          <q-checkbox
            v-model="selectedPermissions"
            :val="permission.id"
            @update:model-value="onSelectionChange"
          />
        </q-item-section>
        <q-item-section>
          <q-item-label>{{ permission.name }}</q-item-label>
        </q-item-section>
        <q-item-section side v-if="selectedRole">
          <q-btn
            flat
            round
            dense
            icon="add_circle"
            color="positive"
            size="sm"
            @click="addPermission(permission.id)"
            :loading="roleStore.isLoading"
          >
            <q-tooltip>Add Permission to Role</q-tooltip>
          </q-btn>
        </q-item-section>
      </q-item>
      <q-item v-if="availablePermissions.length === 0 && !isLoading">
        <q-item-section>
          <q-item-label class="text-grey">
            {{ selectedRole ? 'All permissions are assigned' : 'No permissions available' }}
          </q-item-label>
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
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoleStore } from '../../../stores/role-store';
import SearchPermissions from './SearchPermissions.vue';

const $q = useQuasar();
const roleStore = useRoleStore();

const selectedRole = computed(() => roleStore.selectedRole);
const availablePermissions = computed(() => roleStore.availablePermissions);
const isLoading = computed(() => roleStore.isLoadingPermissions);
const selectedPermissions = ref<string[]>([]);

const allSelected = computed(() => {
  return availablePermissions.value.length > 0 && 
         selectedPermissions.value.length === availablePermissions.value.length;
});

// Clear selection when role changes
watch(selectedRole, () => {
  selectedPermissions.value = [];
});

// Clear selection when permissions list changes (after adding)
watch(availablePermissions, () => {
  // Remove any selected permissions that are no longer available
  selectedPermissions.value = selectedPermissions.value.filter(id =>
    availablePermissions.value.some(p => p.id === id)
  );
});

const onSelectionChange = () => {
  // Selection changed, no action needed
};

const toggleSelectAll = () => {
  if (allSelected.value) {
    // Deselect all
    selectedPermissions.value = [];
  } else {
    // Select all available permissions
    selectedPermissions.value = availablePermissions.value.map(p => p.id);
  }
};

const addPermission = async (permissionId: string) => {
  if (!selectedRole.value) return;

  const success = await roleStore.addPermissionToRole(
    selectedRole.value.id,
    permissionId
  );

  if (success) {
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: 'Permission added successfully!',
    });
    // Refresh role to get updated permissions
    await refreshRolePermissions();
  } else {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: roleStore.error || 'Failed to add permission',
    });
  }
};

const addSelectedPermissions = async () => {
  if (!selectedRole.value || selectedPermissions.value.length === 0) return;

  const success = await roleStore.addPermissionsToRole(
    selectedRole.value.id,
    selectedPermissions.value
  );

  if (success) {
    $q.notify({
      color: 'positive',
      position: 'top',
      icon: 'check_circle',
      message: `${selectedPermissions.value.length} permission(s) added successfully!`,
    });
    // Clear selection
    selectedPermissions.value = [];
    // Refresh role to get updated permissions
    await refreshRolePermissions();
  } else {
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: roleStore.error || 'Failed to add permissions',
    });
  }
};

const refreshRolePermissions = async () => {
  if (!selectedRole.value) return;
  
  // Refresh role to get updated permissions
  await roleStore.fetchRole(selectedRole.value.id);
  // Refresh permissions list (preserve search term if any)
  await roleStore.fetchPermissions(roleStore.permissionSearch || undefined);
};

onMounted(async () => {
  // Fetch all permissions on mount
  if (roleStore.permissions.length === 0) {
    await roleStore.fetchPermissions();
  }
});
</script>

<style scoped>
</style>

