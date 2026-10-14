<template>
  <q-header elevated class="bg-primary text-white">
    <q-toolbar class="header-toolbar">
      <div class="header-drawer-slot">
        <q-btn
          v-if="showHamburger"
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleDrawer"
        />
      </div>

      <div
        v-if="isCompactNav"
        class="header-nav header-nav--compact"
        data-onboarding="navigation"
      >
        <q-btn-dropdown
          v-if="topMenus.length"
          flat
          dense
          no-caps
          :label="selectedTopTitle"
          :icon="selectedTopIcon"
          class="header-nav__current bg-white text-primary"
          menu-anchor="bottom start"
          menu-self="top start"
          content-class="employee-menu-dropdown header-nav-menu"
        >
          <q-list dense style="min-width: 220px">
            <template v-for="item in topMenus" :key="item.id">
              <q-item
                clickable
                v-close-popup
                :active="selectedTopId === item.id"
                :data-onboarding="onboardingTarget(item)"
                @click="openTopMenu(item)"
              >
                <q-item-section v-if="item.icon" avatar>
                  <q-icon :name="item.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ item.title }}</q-item-label>
                </q-item-section>
              </q-item>
              <q-item
                v-for="child in item.children"
                :key="child.id"
                clickable
                v-close-popup
                class="header-nav-menu__child"
                :data-onboarding="onboardingTarget(child)"
                @click="openChildMenu(item, child)"
              >
                <q-item-section v-if="child.icon" avatar>
                  <q-icon :name="child.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ child.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-btn-dropdown>
      </div>

      <div
        v-else
        class="header-nav"
        data-onboarding="navigation"
      >
        <template v-for="(item, idx) in topMenus" :key="item.id">
          <q-btn-dropdown
            v-if="item.children?.length"
            split
            flat
            dense
            :label="item.title"
            :icon="item.icon ?? undefined"
            :data-onboarding="onboardingTarget(item)"
            :class="selectedTopId === item.id ? 'bg-white text-primary' : 'text-white'"
            menu-anchor="bottom start"
            menu-self="top start"
            content-class="employee-menu-dropdown"
            @click="openTopMenu(item)"
          >
            <q-list dense style="min-width: 200px">
              <q-item
                v-for="child in item.children"
                :key="child.id"
                clickable
                v-close-popup
                :data-onboarding="onboardingTarget(child)"
                @click="openChildMenu(item, child)"
              >
                <q-item-section v-if="child.icon" avatar>
                  <q-icon :name="child.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ child.title }}</q-item-label>
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>

          <q-btn
            v-else
            flat
            dense
            :label="item.title"
            :icon="item.icon ?? undefined"
            :data-onboarding="onboardingTarget(item)"
            :class="selectedTopId === item.id ? 'bg-white text-primary' : 'text-white'"
            @click="openTopMenu(item)"
          />

          <q-separator v-if="idx < topMenus.length - 1" vertical class="bg-white" />
        </template>
      </div>

      <q-space />

      <div class="header-actions">
        <ModuleLauncher />
        <NotificationBell />
        <LogoutCard />
      </div>
    </q-toolbar>
    <OnboardingTour />
  </q-header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore, type MenuItem } from '../../../stores/menus';
import { findTopMenuForPath } from '../../../utils/menu-navigation';
import { useHasLeftDrawer } from '../../../composables/useHasLeftDrawer';
import ModuleLauncher from '../common/ModuleLauncher.vue';
import LogoutCard from '../common/LogoutCard.vue';
import NotificationBell from '../common/NotificationBell.vue';
import OnboardingTour from '../common/OnboardingTour.vue';

const props = withDefaults(
  defineProps<{
    showDrawerToggle?: boolean;
  }>(),
  {
    showDrawerToggle: true,
  },
);

const $q = useQuasar();
const { hasLeftDrawer } = useHasLeftDrawer();
const showHamburger = computed(() => props.showDrawerToggle && hasLeftDrawer.value);
const isCompactNav = computed(() => $q.screen.lt.sm);

const menuStore = useMenuStore();
const router = useRouter();
const route = useRoute();
const selectedTopId = ref<string | number | null>(null);

onMounted(async () => {
  if (!menuStore.menuTree.length) {
    await menuStore.fetchMenus();
  }
  syncSelectedTopFromRoute();
});

function syncSelectedTopFromRoute() {
  const match = findTopMenuForPath(route.path, menuStore.activeModuleMenus);
  if (match) {
    selectedTopId.value = match.id;
  }
}

watch(() => route.path, syncSelectedTopFromRoute, { immediate: true });

watch(
  () => [menuStore.activeModuleMenus, menuStore.activeModule] as const,
  () => {
    syncSelectedTopFromRoute();
  },
  { deep: true },
);

const topMenus = computed(() => menuStore.activeModuleMenus || []);

const selectedTopMenu = computed(
  () => topMenus.value.find((item) => item.id === selectedTopId.value) ?? topMenus.value[0] ?? null,
);
const selectedTopTitle = computed(() => selectedTopMenu.value?.title ?? 'Menu');
const selectedTopIcon = computed(() => selectedTopMenu.value?.icon ?? undefined);

function onboardingTarget(item: MenuItem): string | undefined {
  const path = item.route || '';
  if (path.includes('/payroll/reports') || item.title.toLowerCase() === 'reports') {
    return 'reports';
  }

  return undefined;
}

function openTopMenu(item: MenuItem) {
  selectedTopId.value = item.id ?? null;

  if (item.route) {
    void router.push(item.route);
  }

  window.dispatchEvent(new CustomEvent('open-menu', { detail: item.id }));
}

function openChildMenu(parent: MenuItem, child: MenuItem) {
  selectedTopId.value = parent.id ?? null;
  window.dispatchEvent(new CustomEvent('open-menu', { detail: parent.id }));

  if (child.route) {
    void router.push(child.route);
  }
}

function toggleDrawer() {
  window.dispatchEvent(new CustomEvent('toggle-drawer'));
}
</script>

<style scoped>
.header-toolbar {
  min-width: 0;
}

.header-drawer-slot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 2.4em;
  width: 2.4em;
  min-width: 2.4em;
  height: 2.4em;
}

.header-nav {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  gap: 8px;
  overflow-x: auto;
  overflow-y: hidden;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.header-nav::-webkit-scrollbar {
  display: none;
}

.header-nav--compact {
  overflow: visible;
}

.header-nav :deep(.q-btn),
.header-nav :deep(.q-btn-dropdown) {
  flex: 0 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
  flex: 0 0 auto;
}

.header-nav-menu__child {
  padding-left: 36px;
}
</style>
