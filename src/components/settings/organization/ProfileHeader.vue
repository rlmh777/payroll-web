<template>
  <div class="row items-center q-col-gutter-lg">
    <div class="col-auto">
      <q-avatar size="100px" rounded class="bg-grey-3">
        <q-img v-if="org?.logoPath" :src="org.logoPath" />
        <q-icon v-else name="business" size="50px" color="grey-5" />
      </q-avatar>
    </div>

    <div class="col">
      <div class="row items-center justify-between">
        <div>
          <div class="text-h5 text-weight-bold">
            {{ org?.legalName }}
          </div>
          <div class="text-subtitle2 text-primary">
            {{ org?.alias || 'No Alias' }}
          </div>
        </div>

        <slot name="actions" />
      </div>

      <div class="row q-gutter-sm q-mt-xs">
        <q-chip dense icon="mail" outline>{{ org?.email }}</q-chip>
        <q-chip dense icon="phone" outline>{{ org?.phoneNumber1 }}</q-chip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Organization } from '../../../stores/organization-store';
defineProps<{ org: Organization }>();
</script>
