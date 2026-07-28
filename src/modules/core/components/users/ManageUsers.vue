<template>
  <div class="manage-users-container">
    <div class="users-pane">
      <div class="users-pane__search">
        <SearchUsers @user-created="onUserCreated" />
      </div>
      <ViewUsers @user-selected="onUserSelected" />
    </div>
    <UserDetails
      :user="selectedUser"
      @updated="onUserUpdated"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore, type User } from '../../stores/user-store';
import SearchUsers from './SearchUsers.vue';
import ViewUsers from './ViewUsers.vue';
import UserDetails from './UserDetails.vue';

const userStore = useUserStore();
const selectedUser = ref<User | null>(null);

const onUserSelected = async (user: User) => {
  selectedUser.value = user;
  const fullUser = await userStore.fetchUserById(user.id);
  if (fullUser) {
    selectedUser.value = fullUser;
  }
};

const onUserCreated = async (user: User) => {
  await userStore.fetchUsers(true);
  selectedUser.value = user;
  const fullUser = await userStore.fetchUserById(user.id);
  if (fullUser) {
    selectedUser.value = fullUser;
  }
};

const onUserUpdated = (user: User) => {
  selectedUser.value = user;
};
</script>

<style scoped>
.manage-users-container {
  display: flex;
  height: 100%;
  gap: 16px;
  min-height: 0;
}

.users-pane {
  width: min(360px, 42vw);
  min-width: 280px;
  max-width: 400px;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
  min-height: 0;
}

.users-pane__search {
  flex: 0 0 auto;
  padding: 8px 8px 0;
}

.manage-users-container > :last-child {
  flex: 1;
  min-width: 0;
}
</style>
