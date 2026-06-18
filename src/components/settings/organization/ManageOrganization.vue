<template>
  <q-page class="bg-grey-2 q-pa-xl flex justify-center">
    <q-card flat class="profile-card">
      <q-card-section class="q-pa-lg">
        <div v-if="store.isLoading && !store.organizations" class="text-center q-pa-xl">
          <q-spinner-dots color="primary" size="40px" />
        </div>

        <template v-else-if="store.organizationToEdit">
          <ProfileHeader :org="store.organizationToEdit">
            <template #actions>
              <q-btn
                v-if="!isEditing"
                icon="edit"
                label="Edit"
                flat
                color="primary"
                @click="isEditing = true"
              />
              <q-btn
                v-else
                icon="close"
                label="Cancel"
                flat
                color="grey-7"
                @click="isEditing = false"
              />
            </template>
          </ProfileHeader>

          <div class="row q-mt-lg q-col-gutter-md">
            <div class="col-12 col-sm-4 border-right">
              <div class="section-label q-mb-md">DETAILS</div>
              <div class="text-weight-bold">
                {{ store.organizationToEdit.legalName }}
              </div>
              <div class="text-caption text-grey-6">
                {{ store.organizationToEdit.logoPath }}
              </div>

              <div class="section-label q-mt-xl q-mb-md">CONTACT</div>
              <div class="text-body2 text-grey-8">
                {{ store.organizationToEdit.email }}<br />
                {{ store.organizationToEdit.phoneNumber1 }}<br />
                {{ store.organizationToEdit.phoneNumber2 }}<br />
                {{ store.organizationToEdit.street }}
              </div>
            </div>

            <div class="col-12 col-sm-8">
              <ProfileForm
                :org="store.organizationToEdit"
                :editable="isEditing"
                @update="handleUpdate"
              />
            </div>
          </div>
        </template>

        <div v-else class="text-center text-grey-6">No organization found</div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useOrganizationStore } from '../../../stores/organization-store';
import ProfileHeader from './ProfileHeader.vue';
import ProfileForm from './ProfileForm.vue';
import type { Organization } from '../../../stores/organization-store';

const $q = useQuasar();
const store = useOrganizationStore();
const isEditing = ref(false);

const handleUpdate = async (payload: Organization) => {
  try {
    await store.updateOrganization(payload.id, payload);
    isEditing.value = false;
    $q.notify({
      type: 'positive',
      message: 'Organization updated successfully',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: 'Update failed',
    });
  }
};

onMounted(async () => {
  await store.fetchOrganizations();
});
</script>

<style scoped>
.profile-card {
  width: 100%;
  max-width: 1000px;
  border-radius: 12px;
}
.section-label {
  font-size: 11px;
  font-weight: 700;
  color: #bbb;
  letter-spacing: 1px;
}
.border-right {
  border-right: 1px solid #eee;
}
</style>
