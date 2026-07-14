<template>
  <q-page class="q-pa-md">
    <q-card flat>
      <q-tabs v-model="tab" dense class="text-primary" align="left">
        <q-tab name="tiers" label="Weekly Tiers" />
        <q-tab name="rules" label="Contribution Rules" />
      </q-tabs>
      <q-separator />
      <q-tab-panels v-model="tab" animated>
        <q-tab-panel name="tiers" class="q-pa-none">
          <SearchSocialSecurity />
          <q-card-section class="q-pa-none">
            <ViewSocialSecurity />
          </q-card-section>
        </q-tab-panel>
        <q-tab-panel name="rules" class="q-pa-none">
          <ViewContributionRules />
        </q-tab-panel>
      </q-tab-panels>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useSocialSecurityStore } from '../../../stores/social-security-store';
import SearchSocialSecurity from './SearchSocialSecurity.vue';
import ViewSocialSecurity from './ViewSocialSecurity.vue';
import ViewContributionRules from './ViewContributionRules.vue';

const tab = ref('tiers');
const socialSecurityStore = useSocialSecurityStore();

onMounted(async () => {
  await socialSecurityStore.fetchSocialSecurities();
});
</script>
