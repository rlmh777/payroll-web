<template>
  <q-btn flat round dense icon="account_circle">
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-card class="q-pa-md user-menu">
        <q-card-section class="text-center q-pb-sm">
          <q-avatar size="60px" class="bg-primary text-white">
            <q-icon name="person" />
          </q-avatar>
          <div class="q-mt-sm text-weight-medium">{{ authStore.user?.name || 'User' }}</div>
          <div class="text-caption text-grey">{{ authStore.user?.email || 'Logged in' }}</div>
        </q-card-section>

        <q-separator />

        <q-card-section class="q-pt-md q-pb-sm">
          <div class="text-subtitle2 q-mb-sm">Default application</div>
          <q-select
            v-model="defaultModule"
            :options="moduleOptions"
            emit-value
            map-options
            dense
            outlined
            :loading="savingPreference"
            :disable="!moduleOptions.length || savingPreference"
            @update:model-value="onDefaultModuleChange"
          />
          <div class="text-caption text-grey-7 q-mt-xs">
            Loaded when you sign in. Defaults to Payroll.
          </div>
        </q-card-section>

        <q-separator />

        <q-card-actions align="around">
          <q-btn flat icon="logout" label="Logout" color="negative" @click="onLogout" />
        </q-card-actions>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useMenuStore } from '../../../stores/menus';

const $q = useQuasar();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const router = useRouter();

const savingPreference = ref(false);
const defaultModule = ref(authStore.user?.preferences?.defaultModule ?? 'payroll');

const moduleOptions = computed(() =>
  menuStore.enabledModules.map((module) => ({
    label: module.title,
    value: module.code,
  })),
);

watch(
  () => authStore.user?.preferences?.defaultModule,
  (value) => {
    if (value) {
      defaultModule.value = value;
    }
  },
);

onMounted(async () => {
  if (!menuStore.modules.length && authStore.token) {
    await menuStore.fetchMenus();
  }
});

async function onDefaultModuleChange(code: string) {
  if (!code || code === authStore.user?.preferences?.defaultModule) {
    return;
  }

  savingPreference.value = true;
  try {
    await authStore.updatePreferences({ defaultModule: code });
    menuStore.setActiveModule(code);
    $q.notify({ type: 'positive', message: 'Default application updated.' });

    const target = menuStore.enabledModules.find((module) => module.code === code);
    if (target?.default_route) {
      void router.push(target.default_route);
    }
  } catch (error) {
    defaultModule.value = authStore.user?.preferences?.defaultModule ?? 'payroll';
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update default application.',
    });
  } finally {
    savingPreference.value = false;
  }
}

async function onLogout() {
  menuStore.clearMenus();
  await authStore.logout();
  void router.push('/login');
}
</script>

<style scoped>
.user-menu {
  min-width: 280px;
}
</style>
