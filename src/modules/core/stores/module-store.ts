import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useAuthStore } from './auth';
import type { AppModule } from '../utils/module-navigation';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

export const useModuleStore = defineStore('modules', () => {
  const modules = ref<AppModule[]>([]);
  const loading = ref(false);
  const savingCode = ref<string | null>(null);
  const error = ref<string | null>(null);

  const authStore = useAuthStore();

  async function fetchModules() {
    if (!authStore.token) return;

    loading.value = true;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/modules`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch modules: ${response.statusText}`);
      }

      modules.value = await response.json();
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching modules';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function setModuleEnabled(code: string, enabled: boolean) {
    if (!authStore.token) return;

    savingCode.value = code;
    error.value = null;

    try {
      const response = await fetch(`${API_URL}/modules/${code}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authStore.token}`,
        },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.message ?? `Failed to update module: ${response.statusText}`);
      }

      const payload = await response.json();
      modules.value = payload.modules ?? modules.value;
      return payload;
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating module';
      throw err;
    } finally {
      savingCode.value = null;
    }
  }

  return {
    modules,
    loading,
    savingCode,
    error,
    fetchModules,
    setModuleEnabled,
  };
});
