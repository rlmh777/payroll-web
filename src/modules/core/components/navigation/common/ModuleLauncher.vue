<template>
  <q-btn flat round dense icon="apps" aria-label="Modules" data-onboarding="applications">
    <q-menu
      class="module-launcher-menu"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <q-card class="module-launcher" flat>
        <div class="module-launcher__header">
          <div class="module-launcher__title">Applications</div>
          <div class="module-launcher__hint">Browse</div>
        </div>

        <div class="module-launcher__grid">
          <button
            v-for="module in menuStore.launcher"
            :key="module.code"
            type="button"
            class="module-tile"
            :class="menuStore.activeModule === module.code ? 'module-tile--active' : ''"
            @click="selectModule(module)"
          >
            <q-icon :name="module.icon ?? 'widgets'" size="18px" />
            <span>{{ module.title }}</span>
          </button>
        </div>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useMenuStore } from '../../../stores/menus';
import type { AppModule } from '../../../utils/module-navigation';

const menuStore = useMenuStore();
const router = useRouter();

function selectModule(module: AppModule) {
  menuStore.setActiveModule(module.code);

  const defaultRoute = module.default_route ?? '/';

  if (defaultRoute) {
    void router.push(defaultRoute);
  }
}
</script>

<style scoped>
.module-launcher {
  min-width: 220px;
  max-width: 240px;
  padding: 6px;
  border-radius: 10px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.92) 0%, rgba(248, 250, 252, 0.94) 100%);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 8px 22px rgba(15, 23, 42, 0.14);
  border: 1px solid rgba(148, 163, 184, 0.28);
}

.module-launcher__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 6px 6px;
}

.module-launcher__title {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  line-height: 1.2;
  color: #0f172a;
}

.module-launcher__hint {
  font-size: 10px;
  line-height: 1.2;
  color: #94a3b8;
}

.module-launcher__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.module-tile {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  min-height: 52px;
  padding: 6px 4px;
  margin: 0;
  border: 1px solid rgba(148, 163, 184, 0.22);
  border-radius: 8px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(241, 245, 249, 0.88) 100%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.95);
  color: #334155;
  font: inherit;
  font-size: 11px;
    font-weight: 600;
  line-height: 1.15;
  letter-spacing: 0.01em;
  cursor: pointer;
  appearance: none;
}

.module-tile:hover {
  border-color: rgba(37, 99, 235, 0.35);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 1) 0%, rgba(239, 246, 255, 0.95) 100%);
  color: #1e40af;
}

.module-tile--active {
  border-color: rgba(37, 99, 235, 0.5);
  background:
    linear-gradient(180deg, rgba(239, 246, 255, 1) 0%, rgba(219, 234, 254, 0.92) 100%);
  color: #1d4ed8;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.85),
    0 0 0 1px rgba(37, 99, 235, 0.08);
}
</style>

<style>
.module-launcher-menu.q-menu {
  padding: 0;
  box-shadow: none;
  background: transparent;
  border-radius: 10px;
}
</style>
