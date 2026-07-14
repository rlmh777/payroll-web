import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth';
import { useNetworkStore } from 'src/stores/network-store';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';

function resolveUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }

  if (input instanceof URL) {
    return input.href;
  }

  return input.url;
}

function isApiRequest(input: RequestInfo | URL): boolean {
  return resolveUrl(input).startsWith(API_URL);
}

function isAuthExemptRequest(input: RequestInfo | URL): boolean {
  const url = resolveUrl(input);
  return url.endsWith('/login') || url.includes('/users/reset-password');
}

function hasAuthorizationHeader(headers: Headers): boolean {
  return headers.has('Authorization') || headers.has('authorization');
}

function withAuthHeader(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string,
): { input: RequestInfo | URL; init?: RequestInit } {
  const headers = new Headers(
    init?.headers
    ?? (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined),
  );

  if (!hasAuthorizationHeader(headers)) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (input instanceof Request) {
    return {
      input: new Request(input, {
        ...init,
        headers,
      }),
    };
  }

  return {
    input,
    init: {
      ...init,
      headers,
    },
  };
}

export default boot(() => {
  if (typeof window === 'undefined') {
    return;
  }

  const nativeFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const authStore = useAuthStore();
    const networkStore = useNetworkStore();

    let requestInput = input;
    let requestInit = init;

    if (isApiRequest(input) && authStore.token && !isAuthExemptRequest(input)) {
      const authorized = withAuthHeader(input, init, authStore.token);
      requestInput = authorized.input;
      requestInit = authorized.init;
    }

    try {
      const response = await nativeFetch(requestInput, requestInit);

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
