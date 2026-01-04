<template>
  <q-dialog
    v-model="isOpen"
    position="right"
    :maximized="false"
    @hide="onClose"
  >
    <q-card class="edit-vendor-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">Edit Vendor</div>
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
              label="Update"
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
import type { Vendor } from '../models';
import BankSelect from '../bank/BankSelect.vue';

const $q = useQuasar();

interface Props {
  modelValue: boolean;
  vendor: Vendor | null;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  vendor: null,
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'updated': [vendorId: string];
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
  if (!form.value.name || !props.vendor) {
    return;
  }

  try {
    const updatedVendor = await vendorStore.updateVendor(
      props.vendor.id,
      form.value.name,
      form.value.phone || null,
      form.value.email || null,
      form.value.bankId || null,
      form.value.accountNumber || null
    );

    if (updatedVendor) {
      $q.notify({
        color: 'positive',
        position: 'top',
        icon: 'check_circle',
        message: 'Vendor updated successfully!',
      });
      emit('updated', updatedVendor.id);
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
    const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor';
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

// Load vendor data when dialog opens
watch(isOpen, (newValue) => {
  if (newValue && props.vendor) {
    // Populate form with existing data
    form.value = {
      name: props.vendor.name || '',
      phone: props.vendor.phone ?? null,
      email: props.vendor.email ?? null,
      bankId: props.vendor.bankId ?? null,
      accountNumber: props.vendor.accountNumber ?? null,
    };
  }
});
</script>

<style scoped>
.edit-vendor-card {
  width: 30vw;
  height: 100vh;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
}

.edit-vendor-card :deep(.q-card__section) {
  overflow-y: auto;
}
</style>

