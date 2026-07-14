<template>
  <div class="profile-header row items-center no-wrap" :class="{ 'profile-header--compact': compact }">
    <q-avatar :size="compact ? '52px' : '100px'" rounded class="bg-grey-3 q-mr-md">
      <q-img v-if="org?.logoPath" :src="org.logoPath" />
      <q-icon v-else name="business" :size="compact ? '28px' : '50px'" color="grey-5" />
    </q-avatar>

    <div class="col min-width-0">
      <div class="row items-center q-gutter-sm wrap">
        <div :class="compact ? 'text-h6' : 'text-h5'" class="text-weight-bold ellipsis">
          {{ org?.legalName }}
        </div>
        <q-chip
          v-if="org?.alias"
          dense
          size="sm"
          color="primary"
          text-color="white"
          class="q-ma-none"
        >
          {{ org.alias }}
        </q-chip>
      </div>

      <div class="row q-gutter-xs q-mt-xs wrap">
        <q-chip dense size="sm" icon="mail" outline>{{ org?.email }}</q-chip>
        <q-chip dense size="sm" icon="phone" outline>{{ org?.phoneNumber1 }}</q-chip>
      </div>
    </div>

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
import type { Organization } from '../../stores/organization-store';

defineProps<{
  org: Organization;
  compact?: boolean;
}>();
</script>

<style scoped>
.profile-header {
  min-width: 0;
}

.min-width-0 {
  min-width: 0;
}
</style>
