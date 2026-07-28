<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    @hide="onClose"
  >
    <q-card class="add-user-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add User</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit="onSubmit">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            dense
            :rules="[(val) => !!val || 'Name is required']"
            :disable="isSaving"
          />

          <q-input
            v-model="form.email"
            label="Email *"
            type="email"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Email is required',
              (val) => /.+@.+\..+/.test(val) || 'Enter a valid email',
            ]"
            :disable="isSaving"
          />

          <q-input
            v-model="form.password"
            label="Password *"
            type="password"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Password is required',
              (val) => val.length >= 8 || 'Password must be at least 8 characters',
            ]"
            :disable="isSaving"
          />

          <q-input
            v-model="form.passwordConfirmation"
            label="Confirm Password *"
            type="password"
            outlined
            dense
            :rules="[
              (val) => !!val || 'Please confirm password',
              (val) => val === form.password || 'Passwords do not match',
            ]"
            :disable="isSaving"
          />

          <q-select
            v-model="form.roles"
            :options="roleOptions"
            label="Roles"
            outlined
            dense
            multiple
            use-chips
            emit-value
            map-options
            options-dense
            clearable
            :disable="isSaving || roleStore.isLoadingRoles"
            :loading="roleStore.isLoadingRoles"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              :disable="isSaving"
              @click="onClose"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="isSaving"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useUserStore, type User } from '../../stores/user-store';
import { useRoleStore } from '../../stores/role-store';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  saved: [user: User];
}>();

const $q = useQuasar();
const userStore = useUserStore();
const roleStore = useRoleStore();
const isSaving = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  roles: [] as string[],
});

const roleOptions = computed(() =>
  roleStore.roles.map((role) => ({
    label: role.name,
    value: role.id,
  })),
);

const resetForm = () => {
  form.value = {
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    roles: [],
  };
};

onMounted(async () => {
  if (roleStore.roles.length === 0) {
    await roleStore.fetchRoles(1, 100);
  }
});

watch(isOpen, async (open) => {
  if (open) {
    resetForm();
    if (roleStore.roles.length === 0) {
      await roleStore.fetchRoles(1, 100);
    }
  }
});

const onSubmit = async () => {
  isSaving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      email: form.value.email.trim(),
      password: form.value.password,
      password_confirmation: form.value.passwordConfirmation,
      ...(form.value.roles.length > 0 ? { roles: form.value.roles } : {}),
    };

    const user = await userStore.createUser(payload);

    if (user) {
      $q.notify({
        type: 'positive',
        message: 'User created successfully',
        position: 'top',
      });
      emit('saved', user);
      onClose();
    } else {
      $q.notify({
        type: 'negative',
        message: userStore.error || 'Failed to create user',
        position: 'top',
      });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    $q.notify({
      type: 'negative',
      message: 'Failed to create user',
      position: 'top',
    });
  } finally {
    isSaving.value = false;
  }
};

const onClose = () => {
  resetForm();
  isOpen.value = false;
};
</script>

<style scoped>
.add-user-card {
  width: min(420px, 92vw);
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-user-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>
