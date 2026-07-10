<template>
  <q-card-section class="row items-center q-gutter-sm">
    <q-input
      v-model="store.search"
      dense
      debounce="300"
      placeholder="Search bank account types..."
      clearable
      class="col-10"
    />
    <q-space />
    <q-btn dense icon="add_circle" color="primary" @click="store.openCreateDialog()">
      Add Bank Account Type
    </q-btn>
  </q-card-section>

  <AddBankAccountType />
</template>

<script setup lang="ts">
import { useBankAccountTypeStore } from 'src/stores/bank-account-type-store';
import AddBankAccountType from './AddBankAccountType.vue';

const store = useBankAccountTypeStore();
</script>
