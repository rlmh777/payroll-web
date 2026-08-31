<template>
  <q-page class="q-pa-md">
    <q-card flat bordered class="q-mb-md">
      <q-card-section>
        <div class="text-h6">Modules</div>
        <div class="text-body2 text-grey-7">
          Enable or disable application modules for this deployment. Menus are hidden when their
          assigned module is disabled (when multi-module navigation is enabled).
        </div>
      </q-card-section>
    </q-card>

    <q-banner v-if="moduleStore.error" class="bg-negative text-white q-mb-md" rounded dense>
      {{ moduleStore.error }}
    </q-banner>

    <q-card flat bordered>
      <q-list separator>
        <q-item v-for="module in moduleStore.modules" :key="module.code">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white">
              <q-icon :name="module.icon ?? 'widgets'" />
            </q-avatar>
          </q-item-section>

          <q-item-section>
            <q-item-label>{{ module.title }}</q-item-label>
            <q-item-label caption>
              {{ module.default_route || 'No default route' }}
            </q-item-label>
          </q-item-section>

          <q-item-section side>
            <q-toggle
              :model-value="module.enabled"
              :disable="moduleStore.savingCode === module.code"
              :loading="moduleStore.savingCode === module.code"
              @update:model-value="(value) => onToggle(module.code, value)"
            />
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useModuleStore } from '../../stores/module-store';
import { useMenuStore } from '../../stores/menus';

const moduleStore = useModuleStore();
const menuStore = useMenuStore();
const $q = useQuasar();

onMounted(async () => {
  await moduleStore.fetchModules();
});

async function onToggle(code: string, enabled: boolean) {
  try {
    await moduleStore.setModuleEnabled(code, enabled);
    await menuStore.fetchMenus();
    $q.notify({
      type: 'positive',
      message: enabled ? 'Module enabled' : 'Module disabled',
    });
  } catch {
    $q.notify({
      type: 'negative',
      message: moduleStore.error ?? 'Unable to update module',
    });
  }
}
</script>
