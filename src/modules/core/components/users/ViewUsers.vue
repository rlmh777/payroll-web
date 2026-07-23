<template>
  <div class="view-users-container">
    <div class="users-list">
      <div v-if="isLoading && users.length === 0" class="row justify-center q-my-md">
        <q-spinner-dots color="primary" size="40px" />
      </div>
      <div v-else-if="error" class="q-pa-md">
        <q-banner class="bg-negative text-white">
          <template v-slot:avatar>
            <q-icon name="error" />
          </template>
          {{ error }}
        </q-banner>
      </div>
      <div v-else-if="users.length === 0" class="q-pa-md text-center text-grey-6">
        No users found
      </div>
      <div v-else>
        <UserCard
          v-for="user in users"
          :key="user.id"
          :user="user"
          :is-selected="selectedUser?.id === user.id"
          @click="onUserClick"
        />
      </div>

      <q-infinite-scroll @load="loadMore" :offset="250" :disable="isInfiniteScrollDisabled">
        <template v-slot:loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>

      <div v-if="!hasMore && users.length > 0" class="row justify-center q-my-md">
        <div class="text-caption text-grey-6">No more users to load</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useUserStore, type User } from '../../stores/user-store';
import UserCard from './UserCard.vue';

const userStore = useUserStore();
const selectedUser = computed(() => userStore.selectedUser);

const isInitialLoad = ref(true);

onMounted(async () => {
  try {
    await userStore.fetchUsers(true);
    isInitialLoad.value = false;
  } catch (error) {
    console.error('Failed to fetch users:', error);
    isInitialLoad.value = false;
  }
});

const users = computed(() => userStore.users);
const hasMore = computed(() => userStore.hasMore);
const isLoading = computed(() => userStore.isLoading);
const error = computed(() => userStore.error);
const isInfiniteScrollDisabled = computed(
  () => !hasMore.value || isLoading.value || isInitialLoad.value,
);

watch(
  () => [userStore.searchName, userStore.sortBy, userStore.sortDirection],
  async () => {
    if (!isInitialLoad.value) {
      await userStore.fetchUsers(true);
    }
  },
);

const loadMore = async (index: number, done: (stop?: boolean) => void) => {
  if (userStore.isLoading || !userStore.hasMore) {
    done(true);
    return;
  }

  try {
    await userStore.loadMoreUsers();
    done(!userStore.hasMore);
  } catch (error) {
    console.error('Failed to load more users:', error);
    done(true);
  }
};

const onUserClick = (user: User) => {
  userStore.setSelectedUser(user);
  // Emit event to parent to show user details
  emit('user-selected', user);
};

const emit = defineEmits<{
  'user-selected': [user: User];
}>();
</script>

<style scoped>
.view-users-container {
  width: min(320px, 38vw);
  min-width: 260px;
  max-width: 360px;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  flex-shrink: 0;
}

.users-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}
</style>

