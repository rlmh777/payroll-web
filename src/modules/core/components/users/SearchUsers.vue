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
      <div v-if="canManageUsers" class="col-12 col-sm-4">
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
      <div v-if="canManageUsers" class="col-auto">
        <q-btn
          color="primary"
          label="Add User"
          icon="person_add"
          unelevated
          @click="showAddDialog = true"
        />
      </div>
      <div v-if="canManageUsers" class="col-auto">
        <q-btn
          flat
          dense
          icon="security"
          label="Login policy"
          @click="showAuthPolicy = true"
        />
      </div>
    </div>

    <AddUser
      v-if="canManageUsers"
      v-model="showAddDialog"
      @saved="onUserSaved"
    />

    <q-dialog v-model="showAuthPolicy">
      <q-card style="min-width: 340px; max-width: 440px">
        <q-card-section>
          <div class="text-h6">Login policy</div>
          <div class="text-body2 text-grey-7 q-mt-xs">
            Company-wide authenticator 2FA and passkey availability.
          </div>
        </q-card-section>
        <q-card-section class="q-gutter-md">
          <q-select
            v-model="authPolicy.two_factor_policy"
            :options="twoFactorPolicyOptions"
            label="Authenticator 2FA policy"
            outlined
            dense
            emit-value
            map-options
            :disable="isSavingAuthPolicy"
          />
          <q-toggle
            v-model="authPolicy.passkeys_enabled"
            label="Allow passkey sign-in"
            :disable="isSavingAuthPolicy"
          />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup :disable="isSavingAuthPolicy" />
          <q-btn
            color="primary"
            label="Save"
            :loading="isSavingAuthPolicy"
            @click="onSaveAuthPolicy"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { Notify } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useAuthStore } from '@core/stores/auth';
import { useUserStore, type User } from '../../stores/user-store';
import { useRoleStore } from '../../stores/role-store';
import AddUser from './AddUser.vue';

const emit = defineEmits<{
  'user-created': [user: User];
}>();

const userStore = useUserStore();
const roleStore = useRoleStore();
const authStore = useAuthStore();
const { can } = usePermissions();

const canManageUsers = computed(() => can('manager-users'));

const search = ref(userStore.searchName ?? '');
const roleId = ref<string | null>(userStore.roleId);
const showAddDialog = ref(false);
const showAuthPolicy = ref(false);
const isSavingAuthPolicy = ref(false);
const authPolicy = reactive({
  two_factor_policy: 'off' as 'off' | 'optional' | 'required',
  passkeys_enabled: true,
});

const twoFactorPolicyOptions = [
  { label: 'Off — do not require 2FA', value: 'off' },
  { label: 'Optional — users may enable 2FA', value: 'optional' },
  { label: 'Required — enforce 2FA after password login', value: 'required' },
];

const roleOptions = computed(() =>
  roleStore.roles.map((role) => ({
    label: role.name,
    value: role.id,
  })),
);

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';

async function loadAuthPolicy() {
  if (!canManageUsers.value || !authStore.token) {
    return;
  }
  try {
    const response = await fetch(`${apiUrl}/auth-settings`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    authPolicy.two_factor_policy = data.two_factor_policy ?? 'off';
    authPolicy.passkeys_enabled = data.passkeys_enabled ?? true;
  } catch (error) {
    console.error('Failed to load auth settings', error);
  }
}

watch(showAuthPolicy, (open) => {
  if (open) {
    void loadAuthPolicy();
  }
});

onMounted(async () => {
  if (canManageUsers.value && roleStore.roles.length === 0) {
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

const onSaveAuthPolicy = async () => {
  isSavingAuthPolicy.value = true;
  try {
    const response = await fetch(`${apiUrl}/auth-settings`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        two_factor_policy: authPolicy.two_factor_policy,
        passkeys_enabled: authPolicy.passkeys_enabled,
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Failed to save login policy');
    }
    authPolicy.two_factor_policy = data.two_factor_policy ?? authPolicy.two_factor_policy;
    authPolicy.passkeys_enabled = data.passkeys_enabled ?? authPolicy.passkeys_enabled;
    Notify.create({
      type: 'positive',
      message: 'Login policy saved',
      position: 'top',
    });
    showAuthPolicy.value = false;
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save login policy',
      position: 'top',
    });
  } finally {
    isSavingAuthPolicy.value = false;
  }
};
</script>

<style scoped>
.search-users {
  width: 100%;
}
</style>
