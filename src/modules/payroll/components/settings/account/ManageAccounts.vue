<template>
  <q-page class="q-pa-md">
    <div class="row items-center q-mb-md">
      <div class="col">
        <div class="text-h5">Accounts</div>
        <div class="text-caption text-grey-7">Manage chart of accounts</div>
      </div>
    </div>

    <SearchAccounts class="q-mb-md" />
    <ViewAccounts />
  </q-page>
</template>

<script setup lang="ts">
import SearchAccounts from './SearchAccounts.vue';
import ViewAccounts from './ViewAccounts.vue';
</script>
