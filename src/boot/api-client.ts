import { boot } from 'quasar/wrappers';
import { useAuthStore } from 'src/stores/auth';
import { useNetworkStore } from 'src/stores/network-store';
import { resolveTenantSlug } from '@core/utils/tenant';

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';
const TENANT_HEADER = 'X-Tenant';

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
  return url.includes('/login') || url.includes('/users/reset-password');
}

function hasAuthorizationHeader(headers: Headers): boolean {
  return headers.has('Authorization') || headers.has('authorization');
}

function withApiHeaders(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  token: string | null,
): { input: RequestInfo | URL; init?: RequestInit } {
  const headers = new Headers(
    init?.headers
    ?? (typeof input !== 'string' && !(input instanceof URL) ? input.headers : undefined),
  );

  const tenantSlug = resolveTenantSlug();
  if (tenantSlug && !headers.has(TENANT_HEADER)) {
    headers.set(TENANT_HEADER, tenantSlug);
  }

  if (token && !hasAuthorizationHeader(headers)) {
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

    if (isApiRequest(input)) {
      const withHeaders = withApiHeaders(
        input,
        init,
        !isAuthExemptRequest(input) ? authStore.token : null,
      );
      requestInput = withHeaders.input;
      requestInit = withHeaders.init;
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
