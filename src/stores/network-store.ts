import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useNetworkStore = defineStore('network', () => {
  const isOnline = ref(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );
  const hadConnectivityIssue = ref(false);

  function setOnline() {
    isOnline.value = true;
    hadConnectivityIssue.value = false;
  }

  function setOffline() {
    isOnline.value = false;
    hadConnectivityIssue.value = true;
  }

  function reportRequestFailure(error: unknown) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setOffline();
      return;
    }

    if (error instanceof TypeError) {
      hadConnectivityIssue.value = true;
      isOnline.value = false;
    }
  }

  return {
    isOnline,
    hadConnectivityIssue,
    setOnline,
    setOffline,
    reportRequestFailure,
  };
});
