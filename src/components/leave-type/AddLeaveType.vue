<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-leave-type-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add New Leave Type</div>
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
              label="Save"
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
import { useLeaveTypeStore } from '../../stores/leave-type-store';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [leaveTypeId: string];
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
  if (!form.value.name) {
    return;
  }

  const newLeaveType = await leaveTypeStore.createLeaveType(form.value.name);

  if (newLeaveType) {
    emit('saved', newLeaveType.id);
    onClose();
  }
};

const onClose = () => {
  form.value = {
    name: '',
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value.name = '';
  }
});
</script>

<style scoped>
.add-leave-type-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-leave-type-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

