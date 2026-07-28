<template>
  <div class="search-users">
    <div class="row q-col-gutter-sm items-center">
      <div class="col-12 col-sm-grow">
        <q-input
          v-model="search"
          label="Search by name or email"
          outlined
          dense
          clearable
          debounce="300"
          @update:model-value="onSearch"
        >
          <template #append>
            <q-icon name="search" />
          </template>
        </q-input>
      </div>
      <div class="col-12 col-sm-4">
        <q-select
          v-model="roleId"
          :options="roleOptions"
          label="Filter by role"
          outlined
          dense
          clearable
          emit-value
          map-options
          options-dense
          @update:model-value="onRoleFilter"
        />
      </div>
      <div class="col-auto">
        <q-btn
          color="primary"
          label="Add User"
          icon="person_add"
          unelevated
          @click="showAddDialog = true"
        />
      </div>
    </div>

    <AddUser
      v-model="showAddDialog"
      @saved="onUserSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useUserStore, type User } from '../../stores/user-store';
import { useRoleStore } from '../../stores/role-store';
import AddUser from './AddUser.vue';

const emit = defineEmits<{
  'user-created': [user: User];
}>();

const userStore = useUserStore();
const roleStore = useRoleStore();

const search = ref(userStore.searchName ?? '');
const roleId = ref<string | null>(userStore.roleId);
const showAddDialog = ref(false);

const roleOptions = computed(() =>
  roleStore.roles.map((role) => ({
    label: role.name,
    value: role.id,
  })),
);

onMounted(async () => {
  if (roleStore.roles.length === 0) {
    await roleStore.fetchRoles(1, 100);
  }
});

const onSearch = (value: string | number | null) => {
  userStore.setSearchName(typeof value === 'string' ? value : null);
};

const onRoleFilter = (value: string | null) => {
  userStore.setRoleId(value);
};

const onUserSaved = (user: User) => {
  emit('user-created', user);
};
</script>

<style scoped>
.search-users {
  width: 100%;
}

.col-sm-grow {
  flex: 1 1 auto;
}
</style>
