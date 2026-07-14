<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-leave-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Leave Type</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Leave Type Name *"
            outlined
            :rules="[val => !!val || 'Leave type name is required']"
            :disable="leaveTypeStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="leaveTypeStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Update"
              color="primary"
              :loading="leaveTypeStore.isLoading"
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
import { useLeaveTypeStore } from '@/stores/leave-type-store';
import type { LeaveType } from '@core/types/models';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  leaveType: LeaveType | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  leaveType: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [leaveTypeId: string];
}>();

const leaveTypeStore = useLeaveTypeStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
});

const onSubmit = async () => {
  if (!form.value.name || !props.leaveType) {
    return;
  }

  try {
    const updatedLeaveType = await leaveTypeStore.updateLeaveType(
      props.leaveType.id,
      form.value.name
    );

    if (updatedLeaveType) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Leave type updated successfully!',
      });
      emit('updated', String(updatedLeaveType.id));
      onClose();
    } else if (leaveTypeStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: leaveTypeStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update leave type';
    $q.notify({
      color: 'negative',
      position: 'top',
      icon: 'error',
      message: errorMessage,
    });
  }
};

const onClose = () => {
  isOpen.value = false;
};

// Load leave type data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.leaveType) {
    // Populate form with existing data
    form.value = {
      name: props.leaveType.name || '',
    };
  }
});
</script>

<style scoped>
.edit-leave-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-leave-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

