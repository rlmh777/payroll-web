<template>
  <q-btn flat round dense class="header-account-btn" aria-label="Account" data-onboarding="account">
    <q-avatar
      size="32px"
      font-size="13px"
      text-color="white"
      :style="{ backgroundColor: avatarColor }"
    >
      <img v-if="pictureUrl && !pictureBroken" :src="pictureUrl" alt="" @error="pictureBroken = true" />
      <span v-else>{{ initials }}</span>
    </q-avatar>
    <q-menu v-model="accountMenuOpen" transition-show="jump-down" transition-hide="jump-up">
      <q-card class="q-pa-md user-menu">
        <q-card-section class="text-center q-pb-sm">
          <div class="profile-avatar-wrap q-mx-auto">
            <q-avatar
              size="72px"
              font-size="26px"
              text-color="white"
              :style="{ backgroundColor: avatarColor }"
            >
              <img
                v-if="pictureUrl && !pictureBroken"
                :src="pictureUrl"
                alt=""
                @error="pictureBroken = true"
              />
              <span v-else>{{ initials }}</span>
            </q-avatar>
            <q-btn
              round
              dense
              size="sm"
              color="primary"
              icon="photo_camera"
              class="profile-avatar-edit"
              :loading="savingPicture"
              :disable="savingPicture"
              aria-label="Change profile picture"
              @click="pickPicture"
            >
              <q-tooltip>Change photo</q-tooltip>
            </q-btn>
          </div>
          <input
            ref="fileInput"
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            class="hidden-file-input"
            @change="onPictureSelected"
          />
          <div class="q-mt-sm text-weight-medium">{{ authStore.user?.name || 'User' }}</div>
          <div class="text-caption text-grey">{{ authStore.user?.email || 'Logged in' }}</div>
          <q-btn
            v-if="pictureUrl"
            flat
            dense
            no-caps
            size="sm"
            color="grey-8"
            label="Remove photo"
            class="q-mt-xs"
            :disable="savingPicture"
            @click="onRemovePicture"
          />
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

        <q-card-section class="q-py-sm">
          <q-toggle
            :model-value="onboardingEnabled"
            dense
            label="Show product tour"
            :disable="onboarding.saving"
            @update:model-value="onOnboardingToggle"
          />
          <q-btn
            v-if="onboardingEnabled"
            flat
            dense
            no-caps
            size="sm"
            color="primary"
            class="q-ml-none"
            icon="play_circle"
            label="Replay"
            :disable="onboarding.saving || onboarding.active"
            @click="replayTour"
          />
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
import { useOnboardingStore } from '../../../stores/onboarding';
import { getUserAvatarColor, getUserInitials } from '../../users/user-avatar';

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

const $q = useQuasar();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const onboarding = useOnboardingStore();
const router = useRouter();

const savingPreference = ref(false);
const savingPicture = ref(false);
const pictureBroken = ref(false);
const accountMenuOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const defaultModule = ref(authStore.user?.preferences?.defaultModule ?? 'payroll');

const pictureUrl = computed(() => authStore.user?.pictureUrl ?? null);
const initials = computed(() => getUserInitials(authStore.user?.name));
const avatarColor = computed(() =>
  getUserAvatarColor(authStore.user?.email || authStore.user?.name),
);
const onboardingEnabled = computed(() => authStore.user?.preferences?.onboardingEnabled !== false);

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

watch(pictureUrl, () => {
  pictureBroken.value = false;
});

onMounted(async () => {
  if (!menuStore.modules.length && authStore.token) {
    await menuStore.fetchMenus();
  }
});

function pickPicture() {
  fileInput.value?.click();
}

async function onPictureSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';

  if (!file) {
    return;
  }

  if (!file.type.startsWith('image/')) {
    $q.notify({ type: 'negative', message: 'Please choose a JPEG, PNG, GIF, or WebP image.' });
    return;
  }

  if (file.size > MAX_PICTURE_BYTES) {
    $q.notify({ type: 'negative', message: 'Profile pictures must be 5 MB or smaller.' });
    return;
  }

  savingPicture.value = true;
  try {
    await authStore.updatePicture(file);
    $q.notify({ type: 'positive', message: 'Profile picture updated.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update profile picture.',
    });
  } finally {
    savingPicture.value = false;
  }
}

async function onRemovePicture() {
  savingPicture.value = true;
  try {
    await authStore.removePicture();
    $q.notify({ type: 'positive', message: 'Profile picture removed.' });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to remove profile picture.',
    });
  } finally {
    savingPicture.value = false;
  }
}

async function onOnboardingToggle(enabled: boolean) {
  try {
    await onboarding.setEnabled(enabled);
    if (enabled) {
      accountMenuOpen.value = false;
    }
    $q.notify({
      type: 'positive',
      message: enabled ? 'Product tour enabled.' : 'Product tour turned off.',
    });
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update product tour.',
    });
  }
}

function replayTour() {
  accountMenuOpen.value = false;
  void onboarding.replay();
}

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

.header-account-btn :deep(.q-avatar) {
  overflow: hidden;
}

.profile-avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
}

.profile-avatar-edit {
  position: absolute;
  right: -4px;
  bottom: -4px;
}

.hidden-file-input {
  display: none;
}
</style>
