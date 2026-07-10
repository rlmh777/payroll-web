import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth';
import { useNetworkStore } from 'src/stores/network-store';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

function isApiRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

  return url.startsWith(API_URL);
}

function isAuthExemptRequest(input: RequestInfo | URL): boolean {
  const url = typeof input === 'string'
    ? input
    : input instanceof URL
      ? input.href
      : input.url;

  return url.endsWith('/login') || url.endsWith('/logout') || url.endsWith('/user');
}

export default boot(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const authStore = useAuthStore();
    const networkStore = useNetworkStore();

    try {
      const response = await nativeFetch(input, init);

      if (
        isApiRequest(input)
        && response.status === 401
        && !isAuthExemptRequest(input)
        && authStore.isAuthenticated
      ) {
        void authStore.handleUnauthorized('Your session has expired. Please sign in again.');
      }

      if (networkStore.isOnline === false && navigator.onLine) {
        networkStore.setOnline();
      }

      return response;
    } catch (error) {
      if (isApiRequest(input)) {
        networkStore.reportRequestFailure(error);
      }

      throw error;
    }
  };
});
