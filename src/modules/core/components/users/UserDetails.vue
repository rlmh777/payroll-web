<template>
  <div v-if="user" class="user-details-container">
    <q-card>
      <q-card-section>
        <div class="text-h6 q-mb-md">User Details</div>
        
        <div class="row items-center q-mb-md">
          <q-avatar
            :style="{ backgroundColor: getAvatarColor(user.name) }"
            text-color="white"
            size="64px"
            class="q-mr-md"
            font-size="24px"
          >
            {{ getInitial(user.name) }}
          </q-avatar>
          <div>
            <div class="text-h6">{{ user.name }}</div>
            <div class="text-body2 text-grey-7">{{ user.email }}</div>
          </div>
        </div>

        <q-separator class="q-my-md" />

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
        <div class="q-mb-md">
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

        <q-separator class="q-my-md" />

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
import { ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore, type User } from '../../stores/user-store';
import EmployeeSelect from '@hr/components/shared/EmployeeSelect.vue';

const props = defineProps<{
  user: User | null;
}>();

const userStore = useUserStore();
const $q = useQuasar();

const passwordForm = ref({
  newPassword: '',
  confirmPassword: '',
});

const selectedEmployeeId = ref<string | null>(null);
const isChangingPassword = ref(false);
const isLinkingEmployee = ref(false);
const isSendingResetEmail = ref(false);

watch(() => props.user, (newUser) => {
  if (newUser) {
    selectedEmployeeId.value = newUser.employee?.id || null;
  } else {
    selectedEmployeeId.value = null;
  }
  passwordForm.value = {
    newPassword: '',
    confirmPassword: '',
  };
});

const getInitial = (name: string | undefined | null): string => {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    const first = parts[0];
    const last = parts[parts.length - 1];
    if (first && last && first[0] && last[0]) {
      return (first[0] + last[0]).toUpperCase();
    }
  }
  return name.charAt(0).toUpperCase();
};

const getAvatarColor = (name: string | undefined | null): string => {
  const colors: string[] = [
    '#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c2185b',
    '#0097a7', '#5d4037', '#455a64', '#d32f2f', '#0288d1',
    '#00796b', '#8e24aa', '#e64a19', '#303f9f', '#c62828',
    '#558b2f', '#ef6c00', '#6a1b9a', '#00838f', '#ad1457',
    '#1565c0', '#2e7d32', '#e65100', '#4a148c', '#b71c1c',
  ];

  if (!name) return colors[0]!;

  const initial = name.charAt(0).toUpperCase();
  const charCode = initial.charCodeAt(0);
  const colorIndex = charCode % colors.length;
  return colors[colorIndex]!;
};

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
};

const onSendPasswordResetEmail = () => {
  if (!props.user) return;

  $q.dialog({
    title: 'Send Password Reset Email',
    message: `Are you sure you want to send a password reset email to ${props.user?.email || 'this user'}?`,
    cancel: true,
    persistent: true,
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
      // Refresh user data
      await userStore.fetchUserById(props.user.id);
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
    persistent: true,
  }).onOk(() => {
    void (async () => {
    isLinkingEmployee.value = true;
    try {
      // Unlink by setting employee_id to null
      const success = await userStore.linkUserToEmployee(props?.user?.id || '', null);
      
      if (success) {
        $q.notify({
          type: 'positive',
          message: 'Employee unlinked successfully',
          position: 'top',
        });
        await userStore.fetchUserById(props?.user?.id || '');
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

