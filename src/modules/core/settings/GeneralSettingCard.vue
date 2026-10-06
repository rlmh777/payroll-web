<template>
  <div class="setting-grid">
    <div v-if="!submenuItems.length" class="text-grey">No submenu items available.</div>

    <q-card
      v-for="(item, index) in submenuItems"
      :key="item.id ?? item.route ?? index"
      flat
      class="setting-tile cursor-pointer"
      :class="hoverClass(item, index)"
      @click="goTo(item.route)"
    >
      <q-card-section class="setting-tile__body">
        <q-icon :name="item.icon || 'menu'" size="26px" color="primary" />
        <div class="setting-tile__title">{{ item.title }}</div>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMenuStore, type MenuItem } from 'src/stores/menus';
import {
  findGeneralSettingsMenu,
  findMenuBySystemKey,
  findTopMenuForPath,
  isGeneralSettingsPath,
} from '@core/utils/menu-navigation';

const props = defineProps<{
  systemKey?: string;
}>();

const HOVER_MOTIONS = ['lift', 'tilt', 'pop', 'shine', 'wobble', 'glow'] as const;

const router = useRouter();
const route = useRoute();
const menuStore = useMenuStore();

const submenuItems = computed(() => {
  if (props.systemKey) {
    const keyed = findMenuBySystemKey(menuStore.menuTree, props.systemKey);
    if (keyed?.children?.length) {
      return keyed.children;
    }

    return findTopMenuForPath(route.path, menuStore.menuTree)?.children ?? [];
  }

  const generalMenu = findGeneralSettingsMenu(menuStore.menuTree);

  if (isGeneralSettingsPath(route.path, generalMenu) && generalMenu?.children?.length) {
    return generalMenu.children;
  }

  const historyState = window.history.state as { submenu?: string };
  if (!historyState?.submenu) {
    return [];
  }

  try {
    return JSON.parse(historyState.submenu) as MenuItem[];
  } catch (error) {
    console.error('Failed to parse submenu data from history state:', error);
    return [];
  }
});

onMounted(async () => {
  if (!menuStore.menuTree.length) {
    await menuStore.fetchMenus();
  }
});

function hoverClass(item: MenuItem, index: number): string {
  const seed = [...(item.title ?? '')].reduce(
    (sum, character) => sum + character.charCodeAt(0),
    index * 13,
  );
  const motion = HOVER_MOTIONS[seed % HOVER_MOTIONS.length] ?? HOVER_MOTIONS[0];
  return `setting-tile--${motion}`;
}

function goTo(path?: string | null) {
  if (path) {
    router.push(path).catch((err) => {
      console.error('Navigation error:', err);
    });
  }
}
</script>

<style scoped>
.setting-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(124px, 1fr));
  gap: 8px;
}

.setting-tile {
  position: relative;
  overflow: hidden;
  min-height: 84px;
  margin: 0;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.28);
  background:
    linear-gradient(
      165deg,
      rgba(255, 255, 255, 0.97) 0%,
      rgba(241, 245, 249, 0.9) 52%,
      rgba(226, 232, 240, 0.82) 100%
    );
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    inset 0 -1px 0 rgba(148, 163, 184, 0.1),
    0 4px 10px rgba(15, 23, 42, 0.06);
  transition:
    transform 0.28s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.28s ease,
    border-color 0.28s ease;
}

.setting-tile::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(
      125deg,
      rgba(255, 255, 255, 0.62) 0%,
      rgba(255, 255, 255, 0.08) 36%,
      transparent 58%
    );
  pointer-events: none;
}

.setting-tile::after {
  content: '';
  position: absolute;
  top: -40%;
  left: -60%;
  width: 42%;
  height: 180%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.55),
    transparent
  );
  transform: translateX(0) rotate(18deg);
  pointer-events: none;
  opacity: 0;
}

.setting-tile__body {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 8px 8px;
  text-align: center;
}

.setting-tile__title {
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.01em;
  color: #334155;
}

.setting-tile:hover {
  border-color: rgba(37, 99, 235, 0.38);
  z-index: 1;
}

.setting-tile:hover::after {
  opacity: 1;
  animation: setting-sheen 0.7s ease forwards;
}

.setting-tile:hover .setting-tile__title {
  color: #1e40af;
}

.setting-tile--lift:hover {
  transform: translateY(-5px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 12px 22px rgba(15, 23, 42, 0.14);
}

.setting-tile--tilt:hover {
  transform: perspective(420px) rotateY(-8deg) rotateX(4deg) translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    8px 10px 20px rgba(15, 23, 42, 0.12);
}

.setting-tile--pop:hover {
  transform: scale(1.06);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 10px 18px rgba(37, 99, 235, 0.16);
}

.setting-tile--shine:hover {
  transform: translateY(-3px) scale(1.03);
}

.setting-tile--wobble:hover {
  animation: setting-wobble 0.55s ease;
}

.setting-tile--glow:hover {
  transform: translateY(-3px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 3px rgba(59, 130, 246, 0.16),
    0 10px 18px rgba(37, 99, 235, 0.18);
}

@keyframes setting-sheen {
  from {
    transform: translateX(0) rotate(18deg);
  }
  to {
    transform: translateX(420%) rotate(18deg);
  }
}

@keyframes setting-wobble {
  0% {
    transform: rotate(0);
  }
  25% {
    transform: rotate(-3deg) translateY(-2px);
  }
  50% {
    transform: rotate(3deg) translateY(-3px);
  }
  75% {
    transform: rotate(-1.5deg) translateY(-2px);
  }
  100% {
    transform: rotate(0) translateY(-2px);
  }
}
</style>
