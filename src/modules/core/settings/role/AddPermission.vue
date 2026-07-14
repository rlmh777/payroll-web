<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-permission-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add New Permission</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Permission Name *"
            outlined
            :rules="[val => !!val || 'Permission name is required']"
            :disable="roleStore.isLoading"
            hint="e.g., 'create-employee', 'edit-payroll'"
          />

          <q-input
            v-model="form.guardName"
            label="Guard Name"
            outlined
            :disable="roleStore.isLoading"
            hint="Default: 'web' (optional)"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="roleStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="roleStore.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoleStore } from '../../stores/role-store';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [permissionId: string];
}>();

const roleStore = useRoleStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  guardName: 'web',
});

const onSubmit = async () => {
  if (!form.value.name) {
    return;
  }

  try {
    const newPermission = await roleStore.createPermission(
      form.value.name,
      form.value.guardName || undefined
    );

    if (newPermission) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Permission created successfully!',
      });
      emit('saved', newPermission.id);
      onClose();
    } else if (roleStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: roleStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create permission';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  form.value = {
    name: '',
    guardName: 'web',
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      guardName: 'web',
    };
  }
});
</script>

<style scoped>
.add-permission-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-permission-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

