<template>
  <q-btn flat round dense icon="apps" aria-label="Modules">
    <q-menu transition-show="jump-down" transition-hide="jump-up">
      <q-card class="module-launcher q-pa-md">
        <q-card-section class="q-pb-sm">
          <div class="text-subtitle1 text-weight-medium">Applications</div>
          <div class="text-caption text-grey-7">Browse applications</div>
        </q-card-section>

        <q-card-section class="q-pt-none">
          <div class="row q-col-gutter-sm">
            <div
              v-for="module in menuStore.launcher"
              :key="module.code"
              class="col-6"
            >
              <q-btn
                flat
                no-caps
                class="full-width module-tile"
                :class="menuStore.activeModule === module.code ? 'module-tile--active' : ''"
                @click="selectModule(module)"
              >
                <div class="column items-center q-gutter-xs q-py-sm">
                  <q-icon :name="module.icon ?? 'widgets'" size="28px" />
                  <div class="text-body2">{{ module.title }}</div>
                </div>
              </q-btn>
            </div>
          </div>
        </q-card-section>
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
  min-width: 280px;
}

.module-tile {
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
}

.module-tile--active {
  background: rgba(25, 118, 210, 0.08);
  border-color: rgba(25, 118, 210, 0.35);
}
</style>
