<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card style="width: 100%; max-width: 440px" flat bordered>
      <q-card-section>
        <div class="text-h6">Interview score sheet</div>
        <div class="text-caption text-grey-7">
          Enter the code from the email that included this link.
        </div>
      </q-card-section>
      <q-card-section v-if="invalid">
        <q-banner class="bg-red-1" rounded>
          This score sheet link is no longer valid.
        </q-banner>
      </q-card-section>
      <q-card-section v-else-if="loading" class="flex flex-center">
        <q-spinner color="primary" size="32px" />
      </q-card-section>
      <q-card-section v-else>
        <div class="text-subtitle2">{{ vacancyTitle }}</div>
        <div class="text-body2 q-mb-md">{{ memberName }} · {{ memberEmail }}</div>
        <q-input
          v-model="code"
          outlined
          dense
          label="Email code"
          autocomplete="one-time-code"
          @keyup.enter="submit"
        />
        <q-btn
          class="q-mt-md full-width"
          color="primary"
          label="Continue"
          :loading="submitting"
          @click="submit"
        />
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '@core/stores/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const loading = ref(true);
const invalid = ref(false);
const submitting = ref(false);
const vacancyTitle = ref('');
const memberName = ref('');
const memberEmail = ref('');
const code = ref('');

onMounted(() => {
  const token = String(route.params.token || '');
  void fetch(`${API_URL}/panel/access/${encodeURIComponent(token)}`, {
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        invalid.value = true;
        return;
      }
      vacancyTitle.value = body.data?.vacancy_title || 'Interview';
      memberName.value = body.data?.name || '';
      memberEmail.value = body.data?.email || '';
    })
    .catch(() => {
      invalid.value = true;
    })
    .finally(() => {
      loading.value = false;
    });
});

async function submit() {
  const token = String(route.params.token || '');
  if (!code.value.trim()) {
    return;
  }
  submitting.value = true;
  try {
    const result = await authStore.loginWithPanelLink(token, code.value.trim());
    if (result.type === 'success') {
      await router.push('/hr/panel');
    }
  } finally {
    submitting.value = false;
  }
}
</script>
