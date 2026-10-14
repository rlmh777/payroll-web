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
    <q-menu
      v-model="accountMenuOpen"
      class="user-menu-popup"
      anchor="bottom right"
      self="top right"
      :offset="[0, 8]"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <div class="user-menu">
        <q-btn
          class="user-menu__close"
          icon="close"
          flat
          round
          dense
          size="sm"
          color="grey-8"
          aria-label="Close"
          v-close-popup
        />

        <div class="user-menu__card user-menu__card--profile">
          <div class="profile-avatar-wrap q-mx-auto">
            <q-avatar
              size="56px"
              font-size="20px"
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
          <div class="q-mt-sm text-weight-medium ellipsis">{{ authStore.user?.name || 'User' }}</div>
          <div class="text-caption text-grey ellipsis">{{ authStore.user?.email || 'Logged in' }}</div>
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
        </div>

        <div class="user-menu__card user-menu__card--text-size">
          <div class="user-menu__text-size">
            <q-icon name="format_size" size="20px" color="grey-8" />
            <div class="user-menu__text-size-options" role="group" aria-label="Text size">
              <q-btn
                v-for="option in textSizeOptions"
                :key="option.value"
                unelevated
                dense
                no-caps
                class="user-menu__text-size-btn"
                :color="currentTextSize === option.value ? 'primary' : 'grey-3'"
                :text-color="currentTextSize === option.value ? 'white' : 'grey-8'"
                :aria-label="option.label"
                :aria-pressed="currentTextSize === option.value"
                :disable="savingTextSize"
                @click="setTextSize(option.value)"
              >
                <span :style="{ fontSize: option.preview }">A</span>
                <q-tooltip>{{ option.label }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </div>

        <div class="user-menu__card">
          <div class="text-subtitle2 q-mb-sm">Default application</div>
          <div v-if="canChooseDefaultApplication" class="user-menu__combo">
            <q-input
              v-model="moduleFilter"
              :placeholder="selectedModuleLabel"
              outlined
              dense
              bg-color="white"
              :loading="savingPreference"
              :disable="savingPreference"
              @focus="openModuleList"
              @click="openModuleList"
            >
              <template #append>
                <q-icon
                  name="expand_more"
                  class="cursor-pointer"
                  @mousedown.prevent="toggleModuleList"
                />
              </template>
            </q-input>
            <q-list v-if="moduleListOpen" class="user-menu__options" dense @mousedown.prevent>
              <q-item
                v-for="option in filteredModuleOptions"
                :key="option.value"
                clickable
                dense
                :active="option.value === defaultModule"
                @click="selectModule(option.value)"
              >
                <q-item-section>
                  <q-item-label class="ellipsis">{{ option.label }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="!filteredModuleOptions.length" dense>
                <q-item-section class="text-grey-6">No matches</q-item-section>
              </q-item>
            </q-list>
          </div>
          <div v-else class="text-body2">{{ selectedModuleLabel || 'No application available' }}</div>
          <div class="user-menu__combo q-mt-sm">
            <q-input
              v-model="menuFilter"
              outlined
              dense
              bg-color="white"
              label="Default menu"
              :loading="savingPreference"
              :disable="!menuOptions.length || savingPreference"
              @focus="openMenuList"
              @click="openMenuList"
            >
              <template #append>
                <q-icon
                  v-if="defaultMenu && !menuListOpen"
                  name="close"
                  class="cursor-pointer"
                  @mousedown.prevent="clearDefaultMenu"
                />
                <q-icon
                  name="expand_more"
                  class="cursor-pointer"
                  @mousedown.prevent="toggleMenuList"
                />
              </template>
            </q-input>
            <q-list v-if="menuListOpen" class="user-menu__options" dense @mousedown.prevent>
              <q-item
                v-for="option in filteredMenuOptions"
                :key="option.value"
                clickable
                dense
                :active="option.value === defaultMenu"
                @click="selectMenu(option.value)"
              >
                <q-item-section>
                  <q-item-label class="ellipsis">{{ option.label }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item v-if="!filteredMenuOptions.length" dense>
                <q-item-section class="text-grey-6">No matches</q-item-section>
              </q-item>
            </q-list>
          </div>
          <div class="text-caption text-grey-7 q-mt-xs">
            Loaded when you sign in. Leave the menu blank to open the application's default page.
          </div>
        </div>

        <div class="user-menu__card">
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
        </div>

        <div class="user-menu__card user-menu__card--action">
          <q-btn
            flat
            no-caps
            class="full-width"
            icon="logout"
            label="Logout"
            color="negative"
            @click="onLogout"
          />
        </div>
      </div>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../../../stores/auth';
import { useMenuStore } from '../../../stores/menus';
import { useOnboardingStore } from '../../../stores/onboarding';
import {
  collectNavigableMenuOptions,
  pickAccessibleApplicationCode,
  resolvePreferredLandingPath,
} from '../../../utils/menu-navigation';
import { shouldShowApplicationsLauncher } from '../../../utils/module-navigation';
import { getUserAvatarColor, getUserInitials } from '../../users/user-avatar';
import {
  applyTextSize,
  DEFAULT_TEXT_SIZE,
  type TextSize,
} from '../../../utils/text-size';

const textSizeOptions: { value: TextSize; label: string; preview: string }[] = [
  { value: 'sm', label: 'Small text', preview: '11px' },
  { value: 'md', label: 'Medium text', preview: '13px' },
  { value: 'lg', label: 'Large text', preview: '16px' },
];

const MAX_PICTURE_BYTES = 5 * 1024 * 1024;

const $q = useQuasar();
const authStore = useAuthStore();
const menuStore = useMenuStore();
const onboarding = useOnboardingStore();
const router = useRouter();

const savingPreference = ref(false);
const savingTextSize = ref(false);
const savingPicture = ref(false);
const pictureBroken = ref(false);
const accountMenuOpen = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);
const defaultModule = ref(authStore.user?.preferences?.defaultModule ?? 'payroll');
const defaultMenu = ref<string | null>(authStore.user?.preferences?.defaultMenu ?? null);
const moduleFilter = ref('');
const menuFilter = ref('');
const moduleListOpen = ref(false);
const menuListOpen = ref(false);

const pictureUrl = computed(() => authStore.user?.pictureUrl ?? null);
const initials = computed(() => getUserInitials(authStore.user?.name));
const avatarColor = computed(() =>
  getUserAvatarColor(authStore.user?.email || authStore.user?.name),
);
const onboardingEnabled = computed(() => authStore.user?.preferences?.onboardingEnabled !== false);
const currentTextSize = computed(
  () => authStore.user?.preferences?.textSize ?? DEFAULT_TEXT_SIZE,
);

const permittedApplications = computed(() =>
  menuStore.launcher.length ? menuStore.launcher : menuStore.enabledModules,
);

const canChooseDefaultApplication = computed(() =>
  shouldShowApplicationsLauncher(menuStore.launcher),
);

const moduleOptions = computed(() =>
  permittedApplications.value.map((module) => ({
    label: module.title,
    value: module.code,
  })),
);

const filteredModuleOptions = computed(() => {
  const needle = moduleFilter.value.trim().toLowerCase();
  if (!needle) {
    return moduleOptions.value;
  }

  return moduleOptions.value.filter((option) => option.label.toLowerCase().includes(needle));
});

const menuOptions = computed(() =>
  collectNavigableMenuOptions(menuStore.moduleMenus[defaultModule.value] ?? []),
);

const filteredMenuOptions = computed(() => {
  const needle = menuFilter.value.trim().toLowerCase();
  if (!needle) {
    return menuOptions.value;
  }

  return menuOptions.value.filter((option) => option.label.toLowerCase().includes(needle));
});

const selectedModuleLabel = computed(
  () => moduleOptions.value.find((option) => option.value === defaultModule.value)?.label ?? '',
);
const selectedMenuLabel = computed(
  () => menuOptions.value.find((option) => option.value === defaultMenu.value)?.label ?? '',
);

watch(
  () => authStore.user?.preferences?.defaultModule,
  (value) => {
    if (value) {
      defaultModule.value = value;
    }
  },
);

watch(
  () => authStore.user?.preferences?.defaultMenu,
  (value) => {
    defaultMenu.value = value ?? null;
  },
);

watch(pictureUrl, () => {
  pictureBroken.value = false;
});

watch(accountMenuOpen, (open) => {
  if (!open) {
    moduleListOpen.value = false;
    menuListOpen.value = false;
    return;
  }

  moduleFilter.value = selectedModuleLabel.value;
  menuFilter.value = selectedMenuLabel.value;
});

watch(
  permittedApplications,
  (applications) => {
    if (!applications.length) {
      return;
    }

    const next = pickAccessibleApplicationCode(
      defaultModule.value,
      applications,
      menuStore.moduleMenus,
    );
    if (next !== defaultModule.value) {
      defaultModule.value = next;
    }
  },
  { immediate: true },
);

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

function openModuleList() {
  if (!canChooseDefaultApplication.value) {
    return;
  }

  menuListOpen.value = false;
  menuFilter.value = selectedMenuLabel.value;
  if (!moduleListOpen.value && moduleFilter.value === selectedModuleLabel.value) {
    moduleFilter.value = '';
  }
  moduleListOpen.value = true;
}

function openMenuList() {
  moduleListOpen.value = false;
  moduleFilter.value = selectedModuleLabel.value;
  if (!menuListOpen.value && (menuFilter.value === selectedMenuLabel.value || menuFilter.value === '')) {
    menuFilter.value = '';
  }
  menuListOpen.value = true;
}

function toggleModuleList() {
  if (moduleListOpen.value) {
    moduleListOpen.value = false;
    moduleFilter.value = selectedModuleLabel.value;
    return;
  }
  openModuleList();
}

function toggleMenuList() {
  if (menuListOpen.value) {
    menuListOpen.value = false;
    menuFilter.value = selectedMenuLabel.value;
    return;
  }
  openMenuList();
}

async function selectModule(code: string) {
  const label = moduleOptions.value.find((option) => option.value === code)?.label ?? '';
  moduleListOpen.value = false;
  moduleFilter.value = label;
  await onDefaultModuleChange(code);
}

async function selectMenu(route: string) {
  const label = menuOptions.value.find((option) => option.value === route)?.label ?? '';
  menuListOpen.value = false;
  menuFilter.value = label;
  await onDefaultMenuChange(route);
}

async function clearDefaultMenu() {
  menuListOpen.value = false;
  menuFilter.value = '';
  await onDefaultMenuChange(null);
}

function landingPath(moduleCode: string, menuRoute: string | null) {
  return resolvePreferredLandingPath(
    moduleCode,
    menuRoute,
    permittedApplications.value,
    menuStore.moduleMenus,
  );
}

function menuForModule(moduleCode: string, currentMenu: string | null) {
  const options = collectNavigableMenuOptions(menuStore.moduleMenus[moduleCode] ?? []);
  if (currentMenu && options.some((option) => option.value === currentMenu)) {
    return currentMenu;
  }

  return null;
}

async function setTextSize(size: TextSize) {
  if (size === currentTextSize.value || savingTextSize.value) {
    return;
  }

  const previous = currentTextSize.value;
  applyTextSize(size);
  savingTextSize.value = true;
  try {
    await authStore.updatePreferences({ textSize: size });
  } catch (error) {
    applyTextSize(previous);
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update text size.',
    });
  } finally {
    savingTextSize.value = false;
  }
}

async function persistLanding(moduleCode: string, menuRoute: string | null, message: string) {
  savingPreference.value = true;
  accountMenuOpen.value = false;
  try {
    await authStore.updatePreferences({ defaultModule: moduleCode, defaultMenu: menuRoute });
    menuStore.setActiveModule(moduleCode);
    defaultMenu.value = authStore.user?.preferences?.defaultMenu ?? menuRoute;
    $q.notify({ type: 'positive', message });
    await nextTick();
    void router.push(landingPath(moduleCode, menuRoute));
  } catch (error) {
    defaultModule.value = authStore.user?.preferences?.defaultModule ?? 'payroll';
    defaultMenu.value = authStore.user?.preferences?.defaultMenu ?? null;
    $q.notify({
      type: 'negative',
      message: error instanceof Error ? error.message : 'Failed to update default landing page.',
    });
  } finally {
    savingPreference.value = false;
  }
}

async function onDefaultModuleChange(code: string) {
  if (!code || code === authStore.user?.preferences?.defaultModule) {
    return;
  }

  const nextMenu = menuForModule(code, defaultMenu.value);
  defaultMenu.value = nextMenu;
  menuFilter.value = '';
  await persistLanding(code, nextMenu, 'Default application updated.');
}

async function onDefaultMenuChange(route: string | null) {
  const nextMenu = route || null;
  if (nextMenu === (authStore.user?.preferences?.defaultMenu ?? null)) {
    return;
  }

  await persistLanding(defaultModule.value, nextMenu, 'Default menu updated.');
}

async function onLogout() {
  menuStore.clearMenus();
  await authStore.logout();
  void router.push('/login');
}
</script>

<style scoped>
.user-menu {
  position: relative;
  width: 300px;
  padding: 32px 8px 8px;
  background: #eceff1;
  border-radius: 16px;
}

.user-menu__close {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 1;
}

.user-menu__card {
  background: #fff;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 8px;
}

.user-menu__card:last-child {
  margin-bottom: 0;
}

.user-menu__card--profile {
  text-align: center;
  padding-top: 14px;
}

.user-menu__card--action {
  padding: 4px;
}

.user-menu__card--text-size {
  padding: 8px 12px;
}

.user-menu__text-size {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-menu__text-size-options {
  display: flex;
  flex: 1;
  gap: 6px;
}

.user-menu__text-size-btn {
  flex: 1;
  min-height: 32px;
  border-radius: 8px;
}

.user-menu__combo {
  position: relative;
}

.user-menu__options {
  margin-top: 4px;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 8px;
  background: #fff;
}

.header-account-btn :deep(.q-avatar) {
  overflow: hidden;
}

.profile-avatar-wrap {
  position: relative;
  width: 56px;
  height: 56px;
}

.profile-avatar-edit {
  position: absolute;
  right: -6px;
  bottom: -6px;
}

.hidden-file-input {
  display: none;
}
</style>

<style>
.user-menu-popup.q-menu {
  padding: 0;
  background: transparent;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.16);
  overflow: visible;
}

</style>
