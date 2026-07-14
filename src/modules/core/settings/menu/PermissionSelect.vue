<template>
  <div>
    <q-select
      v-model="selectedPermissionName"
      :options="permissionOptions"
      option-value="name"
      option-label="name"
      use-input
      fill-input
      hide-selected
      emit-value
      map-options
      input-debounce="300"
      :readonly="readonly"
      :disable="disable"
      :rules="rules"
      :clearable="clearable"
      :label="label"
      :loading="roleStore.isLoadingPermissions"
      @filter="filterPermissions"
    >
      <template v-if="roleStore.isLoadingPermissions" v-slot:prepend>
        <q-spinner color="primary" size="20px" />
      </template>
      <template v-slot:option="scope">
        <q-item
          v-if="scope.opt.name === 'add-new'"
          clickable
          v-close-popup
          @click="openAddPermissionDialog"
        >
          <q-item-section avatar>
            <q-icon name="add" color="primary" />
          </q-item-section>
          <q-item-section>
            <q-item-label>Add New Permission</q-item-label>
          </q-item-section>
        </q-item>
        <q-item v-else v-bind="scope.itemProps">
          <q-item-section>
            <q-item-label>{{ scope.opt.name }}</q-item-label>
            <q-item-label v-if="scope.opt.guard_name" caption class="text-grey-6">
              ─ Guard: {{ scope.opt.guard_name }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </template>
    </q-select>
    <AddPermission
      v-model="showAddDialog"
      @saved="onPermissionSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoleStore, type Permission } from '../../stores/role-store';
import AddPermission from '../role/AddPermission.vue';

interface Props {
  modelValue?: string | null;
  readonly?: boolean;
  disable?: boolean;
  rules?: Array<(val: string | null | undefined) => boolean | string>;
  clearable?: boolean;
  label?: string;
  showAddNew?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: null,
  readonly: false,
  disable: false,
  rules: () => [],
  clearable: false,
  label: 'Permission',
  showAddNew: false,
});

const emit = defineEmits<{
  'update:modelValue': [value: string | null];
  'change': [value: string | null];
}>();

const roleStore = useRoleStore();

const filterTimeout = ref<ReturnType<typeof setTimeout> | null>(null);
const showAddDialog = ref<boolean>(false);

const permissionOptions = computed((): (Permission | { id: string; name: string; guard_name?: string })[] => {
  const options: (Permission | { id: string; name: string; guard_name?: string })[] = [...roleStore.permissions];
  if (props.showAddNew && !props.readonly) {
    options.unshift({ id: 'add-new', name: 'Add New Permission' });
  }
  return options;
});

const filterPermissions = (val: string, update: (callback: () => void) => void) => {
  // Clear any existing timeout
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }

  // If empty string, show all permissions without fetching
  if (!val || val.trim() === '') {
    update(() => {
      // Keep current options - no need to refetch
    });
    return;
  }

  // Call update immediately to show we're handling it
  update(() => {
    // Keep current options while fetching
  });

  // Debounce API calls - wait 300ms after user stops typing
  filterTimeout.value = setTimeout(() => {
    void roleStore.fetchPermissions(val);
  }, 300);
};

const selectedPermissionName = computed({
  get: (): string | null => {
    return props.modelValue || null;
  },
  set: (value: string | null) => {
    // Don't set value if "add-new" is selected
    if (value === 'add-new') {
      openAddPermissionDialog();
      return;
    }
    emit('update:modelValue', value);
    emit('change', value);
  },
});

const openAddPermissionDialog = () => {
  showAddDialog.value = true;
};

const onPermissionSaved = async (permissionId: string) => {
  // Refresh permissions to include the newly created one
  await roleStore.fetchPermissions();
  // Find the newly created permission and select it
  const newPermission = roleStore.permissions.find(p => p.id === permissionId);
  if (newPermission) {
    emit('update:modelValue', newPermission.name);
    emit('change', newPermission.name);
  }
};

// Fetch permissions on mount if not already loaded
onMounted(async () => {
  if (roleStore.permissions.length === 0) {
    await roleStore.fetchPermissions();
  }
});

// Cleanup timeout on unmount
onUnmounted(() => {
  if (filterTimeout.value) {
    clearTimeout(filterTimeout.value);
  }
});
</script>

<style scoped>
</style>

