import { onMounted, onUnmounted } from 'vue';
import { useNetworkStore } from 'src/stores/network-store';

export function useNetworkStatus() {
  const networkStore = useNetworkStore();

  function handleOnline() {
    networkStore.setOnline();
  }

  function handleOffline() {
    networkStore.setOffline();
  }

  onMounted(() => {
    if (navigator.onLine) {
      networkStore.setOnline();
    } else {
      networkStore.setOffline();
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  });

  onUnmounted(() => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  });
}
