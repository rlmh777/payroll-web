<template>
  <div v-if="user" class="user-details-container">
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">User Details</div>
        
        <div class="row items-center q-mb-md">
          <q-avatar
            :style="{ backgroundColor: getUserAvatarColor(user.name || user.email) }"
            text-color="white"
            size="64px"
            class="q-mr-md"
            font-size="24px"
          >
            {{ getUserInitials(user.name) }}
          </q-avatar>
          <div>
            <div class="text-h6">{{ user.name }}</div>
            <div class="text-body2 text-grey-7">{{ user.email }}</div>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Roles Section -->
        <div v-if="canManageUsers" class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Roles</div>
          <div class="row q-gutter-sm q-mb-sm items-center">
            <q-chip
              v-for="role in userRoles"
              :key="role.id"
              color="primary"
              text-color="white"
              removable
              :disable="isUpdatingRoles"
              @remove="onRemoveRole(role.id)"
            >
              {{ role.name }}
            </q-chip>
            <div v-if="userRoles.length === 0" class="text-body2 text-grey-6">
              No roles assigned
            </div>
          </div>
          <div class="row q-gutter-sm items-end">
            <div class="col">
              <q-select
                v-model="roleToAdd"
                :options="availableRoleOptions"
                label="Add role"
                outlined
                dense
                emit-value
                map-options
                options-dense
                clearable
                :disable="isUpdatingRoles || availableRoleOptions.length === 0"
                :loading="roleStore.isLoadingRoles"
              />
            </div>
            <div class="col-auto">
              <q-btn
                label="Add"
                color="primary"
                :disable="!roleToAdd"
                :loading="isUpdatingRoles"
                @click="onAddRole"
              />
            </div>
          </div>
        </div>

        <div v-else class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Roles</div>
          <div class="row q-gutter-sm q-mb-sm items-center">
            <q-chip
              v-for="role in userRoles"
              :key="role.id"
              color="primary"
              text-color="white"
            >
              {{ role.name }}
            </q-chip>
            <div v-if="userRoles.length === 0" class="text-body2 text-grey-6">
              No roles assigned
            </div>
          </div>
        </div>

        <q-separator class="q-my-md" />

        <!-- Security Section -->
        <div v-if="canManageUsers" class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Security</div>
          <div class="text-body2 q-mb-sm">
            <div class="row q-mb-xs">
              <div class="col-6 text-grey-7">Passkeys registered:</div>
              <div class="col-6">{{ user.security?.passkey_count ?? 0 }}</div>
            </div>
            <div class="row q-mb-xs">
              <div class="col-6 text-grey-7">Authenticator 2FA:</div>
              <div class="col-6">{{ user.security?.two_factor_enabled ? 'Enabled' : 'Not set up' }}</div>
            </div>
            <div class="row q-mb-xs">
              <div class="col-6 text-grey-7">Policy effective:</div>
              <div class="col-6">{{ user.security?.requires_two_factor ? '2FA required' : '2FA not required' }}</div>
            </div>
          </div>
          <div class="text-caption text-grey-7 q-mb-sm">
            Company policy can require 2FA for everyone. Per-user override: leave as Inherit, or Force / Exempt this account.
          </div>
          <div class="row q-gutter-sm items-end">
            <div class="col">
              <q-select
                v-model="twoFactorRequiredOverride"
                :options="twoFactorOverrideOptions"
                label="2FA requirement"
                outlined
                dense
                emit-value
                map-options
                :disable="isUpdatingSecurity"
              />
            </div>
            <div class="col-auto">
              <q-btn
                label="Save"
                color="primary"
                :loading="isUpdatingSecurity"
                @click="onSaveSecurity"
              />
            </div>
            <div class="col-auto">
              <q-btn
                flat
                color="negative"
                label="Reset 2FA"
                :loading="isUpdatingSecurity"
                :disable="!user.security?.two_factor_enabled"
                @click="onResetTwoFactor"
              />
            </div>
          </div>
          <div v-if="isViewingSelf" class="q-mt-md column q-gutter-sm">
            <q-btn
              outline
              color="primary"
              icon="fingerprint"
              label="Register passkey on this device"
              :loading="isRegisteringPasskey"
              @click="onRegisterPasskey"
            />
            <template v-if="!user.security?.two_factor_enabled && !selfTwoFactorSetup">
              <q-btn
                outline
                color="primary"
                icon="phonelink_lock"
                label="Set up authenticator 2FA"
                :loading="isSettingUpTwoFactor"
                @click="onBeginSelfTwoFactor"
              />
            </template>
            <div v-if="selfTwoFactorSetup" class="q-mt-sm">
              <div class="text-body2 q-mb-sm">Scan this QR code, then enter the 6-digit code to confirm.</div>
              <div class="flex flex-center q-mb-sm">
                <img :src="selfTwoFactorSetup.qr_svg" alt="Authenticator QR code" style="width: 180px; height: 180px" />
              </div>
              <div class="text-caption text-grey-7 q-mb-sm text-center">
                Manual key: <strong>{{ selfTwoFactorSetup.secret }}</strong>
              </div>
              <q-input
                v-model="selfTwoFactorCode"
                label="Authentication code"
                outlined
                dense
                class="q-mb-sm"
                autocomplete="one-time-code"
              />
              <div class="row q-gutter-sm">
                <q-btn
                  color="primary"
                  label="Confirm 2FA"
                  :loading="isSettingUpTwoFactor"
                  @click="onConfirmSelfTwoFactor"
                />
                <q-btn flat label="Cancel" :disable="isSettingUpTwoFactor" @click="cancelSelfTwoFactor" />
              </div>
            </div>
            <div v-if="selfRecoveryCodes.length" class="q-mt-sm">
              <div class="text-body2 q-mb-sm">Save these recovery codes now. They will not be shown again.</div>
              <q-list bordered dense class="rounded-borders q-mb-sm">
                <q-item v-for="code in selfRecoveryCodes" :key="code">
                  <q-item-section>{{ code }}</q-item-section>
                </q-item>
              </q-list>
              <q-btn flat color="primary" label="Dismiss" @click="selfRecoveryCodes = []" />
            </div>
            <q-btn
              v-if="user.security?.two_factor_enabled && !user.security?.requires_two_factor"
              flat
              color="negative"
              label="Disable authenticator 2FA"
              :loading="isSettingUpTwoFactor"
              @click="onDisableSelfTwoFactor"
            />
          </div>
        </div>

        <q-separator v-if="canManageUsers" class="q-my-md" />

        <!-- Send Password Reset Email Section -->
        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Password Reset Email</div>
          <div class="text-body2 text-grey-7 q-mb-sm">
            Send a password reset email to {{ user?.email || 'this user' }}. The user will receive an email with a link to reset their password.
          </div>
          <q-btn
            label="Send Password Reset Email"
            color="secondary"
            :loading="isSendingResetEmail"
            @click="onSendPasswordResetEmail"
          />
        </div>

        <q-separator class="q-my-md" />

        <!-- Change Password Section -->
        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Change Password</div>
          <q-form @submit="onChangePassword" class="q-gutter-md">
            <q-input
              v-model="passwordForm.newPassword"
              label="New Password"
              type="password"
              outlined
              dense
              :rules="[val => !!val || 'Password is required', val => val.length >= 8 || 'Password must be at least 8 characters']"
              :disable="isChangingPassword"
            />
            <q-input
              v-model="passwordForm.confirmPassword"
              label="Confirm Password"
              type="password"
              outlined
              dense
              :rules="[
                val => !!val || 'Please confirm password',
                val => val === passwordForm.newPassword || 'Passwords do not match'
              ]"
              :disable="isChangingPassword"
            />
            <q-btn
              type="submit"
              label="Change Password"
              color="primary"
              :loading="isChangingPassword"
              :disable="!passwordForm.newPassword || !passwordForm.confirmPassword"
            />
          </q-form>
        </div>

        <q-separator class="q-my-md" />

        <!-- Link to Employee Section -->
        <div v-if="canManageUsers" class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Link to Employee</div>
          <div v-if="user.employee" class="q-mb-sm">
            <q-chip color="positive" text-color="white" icon="badge">
              Linked to: {{ user.employee.firstName }} {{ user.employee.lastName }} ({{ user.employee.code }})
            </q-chip>
            <q-btn
              flat
              dense
              label="Unlink"
              color="negative"
              size="sm"
              class="q-ml-sm"
              @click="onUnlinkEmployee"
              :loading="isLinkingEmployee"
            />
          </div>
          <div v-else>
            <EmployeeSelect
              v-model="selectedEmployeeId"
              label="Select Employee"
              :disable="isLinkingEmployee"
              clearable
            />
            <q-btn
              label="Link Employee"
              color="primary"
              class="q-mt-sm"
              :disable="!selectedEmployeeId"
              :loading="isLinkingEmployee"
              @click="onLinkEmployee"
            />
          </div>
        </div>

        <div v-else-if="user.employee" class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">Linked Employee</div>
          <q-chip color="positive" text-color="white" icon="badge">
            {{ user.employee.firstName }} {{ user.employee.lastName }} ({{ user.employee.code }})
          </q-chip>
        </div>

        <q-separator v-if="canManageUsers || user.employee" class="q-my-md" />

        <!-- User Info -->
        <div class="q-mb-md">
          <div class="text-subtitle1 q-mb-sm">User Information</div>
          <div class="text-body2">
            <div class="row q-mb-xs">
              <div class="col-4 text-grey-7">Email Verified:</div>
              <div class="col-8">
                <q-icon
                  :name="user.email_verified_at ? 'check_circle' : 'cancel'"
                  :color="user.email_verified_at ? 'positive' : 'negative'"
                  size="sm"
                />
                {{ user.email_verified_at ? 'Yes' : 'No' }}
              </div>
            </div>
            <div v-if="user.created_at" class="row q-mb-xs">
              <div class="col-4 text-grey-7">Created:</div>
              <div class="col-8">{{ formatDate(user.created_at) }}</div>
            </div>
            <div v-if="user.updated_at" class="row q-mb-xs">
              <div class="col-4 text-grey-7">Updated:</div>
              <div class="col-8">{{ formatDate(user.updated_at) }}</div>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>
  </div>
  <div v-else class="user-details-container">
    <q-card>
      <q-card-section>
        <div class="text-center text-grey-6">
          <q-icon name="person" size="48px" class="q-mb-md" />
          <div>Select a user to view details</div>
        </div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { usePermissions } from '@core/composables/usePermissions';
import { useUserStore, type User } from '../../stores/user-store';
import { useRoleStore } from '../../stores/role-store';
import { useAuthStore } from '@core/stores/auth';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';
import { getUserAvatarColor, getUserInitials } from './user-avatar';

const props = defineProps<{
  user: User | null;
}>();

const emit = defineEmits<{
  updated: [user: User];
}>();

const userStore = useUserStore();
const roleStore = useRoleStore();
const $q = useQuasar();
const { can } = usePermissions();

const canManageUsers = computed(() => can('manager-users'));

const passwordForm = ref({
  newPassword: '',
  confirmPassword: '',
});

const selectedEmployeeId = ref<string | null>(null);
const roleToAdd = ref<string | null>(null);
const isChangingPassword = ref(false);
const isLinkingEmployee = ref(false);
const isSendingResetEmail = ref(false);
const isUpdatingRoles = ref(false);
const isUpdatingSecurity = ref(false);
const isRegisteringPasskey = ref(false);
const isSettingUpTwoFactor = ref(false);
const selfTwoFactorSetup = ref<{ secret: string; qr_svg: string } | null>(null);
const selfTwoFactorCode = ref('');
const selfRecoveryCodes = ref<string[]>([]);
const twoFactorRequiredOverride = ref<boolean | null>(null);
const authStore = useAuthStore();

const twoFactorOverrideOptions = [
  { label: 'Inherit company policy', value: null },
  { label: 'Force 2FA for this user', value: true },
  { label: 'Exempt this user from 2FA', value: false },
];

const isViewingSelf = computed(
  () => !!props.user && String(props.user.id) === String(authStore.user?.id ?? ''),
);

const userRoles = computed(() => props.user?.rolesManyToMany || []);

const availableRoleOptions = computed(() => {
  const assignedIds = new Set(userRoles.value.map((role) => role.id));
  return roleStore.roles
    .filter((role) => !assignedIds.has(role.id))
    .map((role) => ({
      label: role.name,
      value: role.id,
    }));
});

onMounted(async () => {
  if (canManageUsers.value && roleStore.roles.length === 0) {
    await roleStore.fetchRoles(1, 100);
  }
});

watch(() => props.user, (newUser) => {
  if (newUser) {
    selectedEmployeeId.value = newUser.employee?.id || null;
    twoFactorRequiredOverride.value = newUser.security?.two_factor_required ?? null;
  } else {
    selectedEmployeeId.value = null;
    twoFactorRequiredOverride.value = null;
  }
  roleToAdd.value = null;
  passwordForm.value = {
    newPassword: '',
    confirmPassword: '',
  };
});

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const refreshUser = async (userId: string) => {
  const fullUser = await userStore.fetchUserById(userId);
  if (fullUser) {
    emit('updated', fullUser);
  }
  return fullUser;
};

const onAddRole = async () => {
  if (!props.user || !roleToAdd.value) return;

  isUpdatingRoles.value = true;
  try {
    const updated = await userStore.assignRoles(props.user.id, [roleToAdd.value]);
    if (updated) {
      $q.notify({
        type: 'positive',
        message: 'Role added successfully',
        position: 'top',
      });
      roleToAdd.value = null;
      emit('updated', updated);
      await refreshUser(props.user.id);
    } else {
      $q.notify({
        type: 'negative',
        message: userStore.error || 'Failed to add role',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error adding role:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to add role',
      position: 'top',
    });
  } finally {
    isUpdatingRoles.value = false;
  }
};

const saveUserSecurity = async (payload: {
  two_factor_required?: boolean | null;
  reset_two_factor?: boolean;
}) => {
  if (!props.user) return;
  isUpdatingSecurity.value = true;
  try {
    const authStore = useAuthStore();
    const response = await fetch(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3031/api'}/users/${props.user.id}/security`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      throw new Error('Failed to update security settings');
    }
    $q.notify({
      type: 'positive',
      message: 'Security settings updated',
      position: 'top',
    });
    await refreshUser(props.user.id);
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: 'Failed to update security settings',
      position: 'top',
    });
  } finally {
    isUpdatingSecurity.value = false;
  }
};

const onSaveSecurity = async () => {
  await saveUserSecurity({ two_factor_required: twoFactorRequiredOverride.value });
};

const onResetTwoFactor = () => {
  $q.dialog({
    title: 'Reset 2FA',
    message: 'Clear this user’s authenticator setup? They will need to enroll again if 2FA is required.',
    cancel: true,
  }).onOk(() => {
    void saveUserSecurity({ reset_two_factor: true });
  });
};

const onRegisterPasskey = async () => {
  if (!props.user) return;
  isRegisteringPasskey.value = true;
  try {
    const { startRegistration } = await import('@simplewebauthn/browser');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
    const optionsResponse = await fetch(`${apiUrl}/passkeys/options`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    if (!optionsResponse.ok) {
      throw new Error('Unable to start passkey registration');
    }
    const { options, challenge_key: challengeKey } = await optionsResponse.json();
    const credential = await startRegistration({ optionsJSON: options });
    const registerResponse = await fetch(`${apiUrl}/passkeys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({
        challenge_key: challengeKey,
        credential,
        name: 'This device',
      }),
    });
    if (!registerResponse.ok) {
      const err = await registerResponse.json().catch(() => ({}));
      throw new Error(err.message || 'Passkey registration failed');
    }
    $q.notify({
      type: 'positive',
      message: 'Passkey registered. You can use it on the login screen.',
      position: 'top',
    });
    await refreshUser(props.user.id);
  } catch (error) {
    console.error(error);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Passkey registration failed',
      position: 'top',
    });
  } finally {
    isRegisteringPasskey.value = false;
  }
};

const cancelSelfTwoFactor = () => {
  selfTwoFactorSetup.value = null;
  selfTwoFactorCode.value = '';
};

const onBeginSelfTwoFactor = async () => {
  isSettingUpTwoFactor.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
    const response = await fetch(`${apiUrl}/two-factor/setup`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Unable to start 2FA setup');
    }
    selfTwoFactorSetup.value = {
      secret: data.secret,
      qr_svg: data.qr_svg,
    };
    selfTwoFactorCode.value = '';
    selfRecoveryCodes.value = [];
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Unable to start 2FA setup',
      position: 'top',
    });
  } finally {
    isSettingUpTwoFactor.value = false;
  }
};

const onConfirmSelfTwoFactor = async () => {
  if (!props.user || !selfTwoFactorCode.value.trim()) {
    return;
  }
  isSettingUpTwoFactor.value = true;
  try {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
    const response = await fetch(`${apiUrl}/two-factor/confirm`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authStore.token}`,
      },
      body: JSON.stringify({ code: selfTwoFactorCode.value.trim() }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.message || 'Invalid authentication code');
    }
    selfRecoveryCodes.value = Array.isArray(data.recovery_codes) ? data.recovery_codes : [];
    cancelSelfTwoFactor();
    $q.notify({
      type: 'positive',
      message: 'Authenticator 2FA enabled',
      position: 'top',
    });
    await refreshUser(props.user.id);
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to enable 2FA',
      position: 'top',
    });
  } finally {
    isSettingUpTwoFactor.value = false;
  }
};

const onDisableSelfTwoFactor = () => {
  $q.dialog({
    title: 'Disable 2FA',
    message: 'Turn off authenticator 2FA for your account?',
    cancel: true,
  }).onOk(() => {
    void (async () => {
      if (!props.user) return;
      isSettingUpTwoFactor.value = true;
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
        const response = await fetch(`${apiUrl}/two-factor`, {
          method: 'DELETE',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${authStore.token}`,
          },
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.message || 'Unable to disable 2FA');
        }
        selfRecoveryCodes.value = [];
        $q.notify({
          type: 'positive',
          message: 'Authenticator 2FA disabled',
          position: 'top',
        });
        await refreshUser(props.user.id);
      } catch (error) {
        $q.notify({
          type: 'negative',
          message: error instanceof Error ? error.message : 'Unable to disable 2FA',
          position: 'top',
        });
      } finally {
        isSettingUpTwoFactor.value = false;
      }
    })();
  });
};

const onRemoveRole = (roleId: string) => {
  if (!props.user) return;

  $q.dialog({
    title: 'Remove Role',
    message: 'Remove this role from the user?',
    cancel: true,
  }).onOk(() => {
    void (async () => {
      if (!props.user) return;
      isUpdatingRoles.value = true;
      try {
        const updated = await userStore.removeRoles(props.user.id, [roleId]);
        if (updated) {
          $q.notify({
            type: 'positive',
            message: 'Role removed successfully',
            position: 'top',
          });
          emit('updated', updated);
          await refreshUser(props.user.id);
        } else {
          $q.notify({
            type: 'negative',
            message: userStore.error || 'Failed to remove role',
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error removing role:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to remove role',
          position: 'top',
        });
      } finally {
        isUpdatingRoles.value = false;
      }
    })();
  });
};

const onSendPasswordResetEmail = () => {
  if (!props.user) return;

  $q.dialog({
    title: 'Send Password Reset Email',
    message: `Are you sure you want to send a password reset email to ${props.user?.email || 'this user'}?`,
    cancel: true,
  }).onOk(() => {
    void (async () => {
      if (!props.user) return;
      isSendingResetEmail.value = true;
      try {
        const success = await userStore.sendPasswordResetEmail(props.user.id);

        if (success) {
          $q.notify({
            type: 'positive',
            message: 'Password reset email sent successfully',
            position: 'top',
          });
        } else {
          $q.notify({
            type: 'negative',
            message: userStore.error || 'Failed to send password reset email',
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error sending password reset email:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to send password reset email',
          position: 'top',
        });
      } finally {
        isSendingResetEmail.value = false;
      }
    })();
  });
};

const onChangePassword = async () => {
  if (!props.user) return;

  isChangingPassword.value = true;
  try {
    const success = await userStore.updateUserPassword(
      props.user.id,
      passwordForm.value.newPassword
    );

    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Password changed successfully',
        position: 'top',
      });
      passwordForm.value = {
        newPassword: '',
        confirmPassword: '',
      };
    } else {
      $q.notify({
        type: 'negative',
        message: userStore.error || 'Failed to change password',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error changing password:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to change password',
      position: 'top',
    });
  } finally {
    isChangingPassword.value = false;
  }
};

const onLinkEmployee = async () => {
  if (!props.user || !selectedEmployeeId.value) return;

  isLinkingEmployee.value = true;
  try {
    const success = await userStore.linkUserToEmployee(
      props.user.id,
      selectedEmployeeId.value
    );

    if (success) {
      $q.notify({
        type: 'positive',
        message: 'Employee linked successfully',
        position: 'top',
      });
      await refreshUser(props.user.id);
    } else {
      $q.notify({
        type: 'negative',
        message: userStore.error || 'Failed to link employee',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error linking employee:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to link employee',
      position: 'top',
    });
  } finally {
    isLinkingEmployee.value = false;
  }
};

const onUnlinkEmployee = () => {
  if (!props.user) return;

  $q.dialog({
    title: 'Confirm Unlink',
    message: 'Are you sure you want to unlink this employee from the user?',
    cancel: true,
  }).onOk(() => {
    void (async () => {
      if (!props.user) return;
      isLinkingEmployee.value = true;
      try {
        const success = await userStore.linkUserToEmployee(props.user.id, null);

        if (success) {
          $q.notify({
            type: 'positive',
            message: 'Employee unlinked successfully',
            position: 'top',
          });
          await refreshUser(props.user.id);
        } else {
          $q.notify({
            type: 'negative',
            message: userStore.error || 'Failed to unlink employee',
            position: 'top',
          });
        }
      } catch (error) {
        console.error('Error unlinking employee:', error);
        $q.notify({
          type: 'negative',
          message: 'Failed to unlink employee',
          position: 'top',
        });
      } finally {
        isLinkingEmployee.value = false;
      }
    })();
  });
};
</script>

<style scoped>
.user-details-container {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}
</style>

