<template>
  <div class="manage-users-container">
    <ViewUsers @user-selected="onUserSelected" />
    <UserDetails :user="selectedUser" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useUserStore, type User } from '../../stores/user-store';
import ViewUsers from './ViewUsers.vue';
import UserDetails from './UserDetails.vue';

const userStore = useUserStore();
const selectedUser = ref<User | null>(null);

const onUserSelected = async (user: User) => {
  selectedUser.value = user;
  // Also fetch full user details with employee relationship
  const fullUser = await userStore.fetchUserById(user.id);
  if (fullUser) {
    selectedUser.value = fullUser;
  }
};
</script>

<style scoped>
.manage-users-container {
  display: flex;
  height: 100%;
  gap: 16px;
}
</style>

