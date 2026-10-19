<template>
  <q-page class="q-pa-md">
    <q-card flat bordered>
      <q-card-section>
        <div class="text-h6">Profile change approval</div>
        <div class="text-body2 text-grey-7 q-mt-xs">
          Choose who confirms an employee’s address, phone, and email update. The profile is updated only after that approval.
        </div>
      </q-card-section>

      <q-separator />

      <q-card-section>
        <q-inner-loading :showing="store.isLoading">
          <q-spinner color="primary" size="32px" />
        </q-inner-loading>

        <q-form class="q-gutter-md" @submit.prevent="save">
          <q-option-group
            v-model="form.profileChangeApproval"
            :options="options"
            color="primary"
            :disable="store.isLoading || store.isSaving"
          />

          <div class="row q-gutter-sm">
            <q-btn
              color="primary"
              label="Save"
              type="submit"
              :loading="store.isSaving"
              :disable="store.isLoading"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue';
import { useQuasar } from 'quasar';
import { storeToRefs } from 'pinia';
import {
  useHrSettingStore,
  type ProfileChangeApproval,
} from '@hr/stores/hr-setting-store';

defineProps<{ title?: string }>();

const $q = useQuasar();
const store = useHrSettingStore();
const { settings } = storeToRefs(store);

const form = reactive({
  profileChangeApproval: 'hr' as ProfileChangeApproval,
});

const options = [
  {
    label: 'Supervisor approval — the employee’s supervisor approves the request, and the profile updates when they approve',
    value: 'supervisor',
  },
  {
    label: 'HR approval — HR must approve the request before the profile is updated',
    value: 'hr',
  },
];

watch(
  settings,
  (value) => {
    if (value?.profileChangeApproval) {
      form.profileChangeApproval = value.profileChangeApproval;
    }
  },
  { immediate: true },
);

async function save() {
  try {
    await store.saveSettings({ profileChangeApproval: form.profileChangeApproval });
    $q.notify({ type: 'positive', message: 'Profile change approval saved.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to save profile change approval.',
    });
  }
}

onMounted(() => {
  void store.fetchSettings();
});
</script>
