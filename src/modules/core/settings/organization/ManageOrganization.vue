<template>
  <q-page class="organization-page q-pa-md">
    <div v-if="store.isLoadingOrganization" class="flex flex-center" style="min-height: 240px">
      <q-spinner-dots color="primary" size="40px" />
    </div>

    <template v-else-if="store.organizationToEdit">
      <div class="organization-shell">
        <div class="organization-toolbar row items-center justify-between q-mb-md">
          <ProfileHeader :org="store.organizationToEdit" compact />

          <q-btn
            label="Save Changes"
            color="primary"
            type="submit"
            form="organization-form"
            unelevated
            no-caps
            :loading="store.isLoading"
          />
        </div>

        <ProfileForm
          form-id="organization-form"
          :org="store.organizationToEdit"
          :loading="store.isLoading"
          @update="handleUpdate"
          @preview-theme="handlePreviewTheme"
        />
      </div>
    </template>

    <div v-else class="flex flex-center column" style="min-height: 240px">
      <div class="text-grey-6 q-mb-sm">No organization found</div>
      <div v-if="store.error" class="text-negative text-caption">{{ store.error }}</div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue';
import { useQuasar } from 'quasar';
import { useOrganizationStore } from '../../stores/organization-store';
import { applyCompanyTheme } from '@core/utils/company-theme';
import ProfileHeader from './ProfileHeader.vue';
import ProfileForm from './ProfileForm.vue';
import type { Organization } from '../../stores/organization-store';

const $q = useQuasar();
const store = useOrganizationStore();
const savedTheme = {
  primaryColor: store.organizationToEdit?.primaryColor,
  secondaryColor: store.organizationToEdit?.secondaryColor,
};

const handlePreviewTheme = (payload: { primaryColor?: string; secondaryColor?: string }) => {
  applyCompanyTheme(payload.primaryColor, payload.secondaryColor);
};

const handleUpdate = async (payload: Organization) => {
  try {
    await store.updateOrganization(payload.id, payload);
    store.applyOrganizationTheme();
    savedTheme.primaryColor = store.organizationToEdit?.primaryColor;
    savedTheme.secondaryColor = store.organizationToEdit?.secondaryColor;
    $q.notify({
      type: 'positive',
      message: 'Organization updated successfully',
    });
  } catch {
    store.applyOrganizationTheme();
    $q.notify({
      type: 'negative',
      message: store.error || 'Update failed',
    });
  }
};

onMounted(async () => {
  await store.fetchOrganizations();
  savedTheme.primaryColor = store.organizationToEdit?.primaryColor;
  savedTheme.secondaryColor = store.organizationToEdit?.secondaryColor;
});

onUnmounted(() => {
  applyCompanyTheme(savedTheme.primaryColor, savedTheme.secondaryColor);
});
</script>

<style scoped>
.organization-page {
  min-height: 0;
}

.organization-shell {
  width: 100%;
}

.organization-toolbar {
  gap: 16px;
}
</style>
