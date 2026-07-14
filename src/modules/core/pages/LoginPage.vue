<template>
  <q-page class="flex flex-center">
    <div class="column items-center q-pa-md" style="max-width: 500px; width: 100%">
      <h4 class="q-mb-lg">Login</h4>
      <LoginForm />
    </div>
  </q-page>
</template>

<script setup lang="ts">
import LoginForm from '@core/components/LoginForm.vue'
</script> 