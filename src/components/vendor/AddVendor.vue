<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="add-vendor-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Add Vendor</div>
        <q-space />
        <q-btn icon="close" flat round dense v-close-popup />
      </q-card-section>

      <q-card-section>
        <q-form @submit="onSubmit" class="q-gutter-md">
          <q-input
            v-model="form.name"
            label="Name *"
            outlined
            :rules="[val => !!val || 'Name is required']"
            :disable="vendorStore.isLoading"
          />

          <q-input
            v-model="form.phone"
            label="Phone"
            outlined
            maxlength="255"
            counter
            :disable="vendorStore.isLoading"
          />

          <q-input
            v-model="form.email"
            label="Email"
            type="email"
            outlined
            maxlength="255"
            counter
            :rules="[val => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Please enter a valid email']"
            :disable="vendorStore.isLoading"
          />

          <BankSelect
            v-model="form.bankId"
            :disable="vendorStore.isLoading"
            clearable
            :showAddNew="true"
            :showEdit="true"
          />

          <q-input
            v-model="form.accountNumber"
            label="Account Number"
            outlined
            maxlength="255"
            counter
            :disable="vendorStore.isLoading"
          />

          <div class="row q-gutter-sm justify-end q-mt-lg">
            <q-btn
              flat
              label="Cancel"
              color="grey"
              @click="onClose"
              :disable="vendorStore.isLoading"
            />
            <q-btn
              type="submit"
              label="Save"
              color="primary"
              :loading="vendorStore.isLoading"
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
import { useVendorStore } from '../../stores/vendor-store';
import BankSelect from '../bank/BankSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'saved': [vendorId: string];
}>();

const vendorStore = useVendorStore();

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const form = ref({
  name: '',
  phone: null as string | null,
  email: null as string | null,
  bankId: null as string | null,
  accountNumber: null as string | null,
});

const onSubmit = async () => {
  if (!form.value.name) {
    return;
  }

  try {
    const newVendor = await vendorStore.createVendor(
      form.value.name,
      form.value.phone || null,
      form.value.email || null,
      form.value.bankId || null,
      form.value.accountNumber || null
    );

    if (newVendor) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Vendor created successfully!',
      });
      emit('saved', newVendor.id);
      onClose();
    } else if (vendorStore.error) {
      $q.notify({
        color: 'negative',
        position: 'top',
        icon: 'error',
        message: vendorStore.error,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create vendor';
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
    phone: null,
    email: null,
    bankId: null,
    accountNumber: null,
  };
  isOpen.value = false;
};

// Reset form when dialog opens
watch(isOpen, (newValue) => {
  if (newValue) {
    form.value = {
      name: '',
      phone: null,
      email: null,
      bankId: null,
      accountNumber: null,
    };
  }
});
</script>

<style scoped>
.add-vendor-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.add-vendor-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

