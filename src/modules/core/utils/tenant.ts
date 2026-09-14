const DEFAULT_TENANT = 'chaacreek';

const CENTRAL_HOSTS = new Set(['localhost', '127.0.0.1', 'www']);

/** Azure / local shared hosts — never treat leftmost label as a tenant slug. */
const CENTRAL_HOST_SUFFIXES = [
  'azurecontainerapps.io',
  'web.core.windows.net',
  'localhost',
];

function hostMatchesCentralSuffix(host: string): boolean {
  return CENTRAL_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
}

/**
 * Resolve the active company tenant for API requests.
 * Prefer VITE_TENANT_SLUG; otherwise use the leftmost subdomain.
 */
export function resolveTenantSlug(): string {
  const fromEnv = String(import.meta.env.VITE_TENANT_SLUG ?? '').trim().toLowerCase();
  if (fromEnv) {
    return fromEnv;
  }

  if (typeof window === 'undefined') {
    return DEFAULT_TENANT;
  }

  const host = window.location.hostname.toLowerCase();
  if (hostMatchesCentralSuffix(host)) {
    return DEFAULT_TENANT;
  }

  const parts = host.split('.');
  if (parts.length >= 3 && parts[0] && !CENTRAL_HOSTS.has(parts[0])) {
    return parts[0];
  }

  return DEFAULT_TENANT;
}
