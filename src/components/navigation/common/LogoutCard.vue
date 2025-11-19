<template>
  <!-- Logout / User Menu -->
  <q-btn flat round dense icon="account_circle">
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-card class="q-pa-xl w-400">
        <q-card-section class="text-center">
          <q-avatar size="60px" class="bg-primary text-white">
            <q-icon name="person" />
          </q-avatar>
          <div class="q-mt-sm text-weight-medium">{{ 'User' }}</div>
          <div class="text-caption text-grey">Logged in</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="around">
          <q-btn flat icon="logout" label="Logout" color="negative" />
        </q-card-actions>
      </q-card>
    </q-menu>
  </q-btn>
</template>
