import { Cookies } from 'quasar';

export const AUTH_TOKEN_COOKIE = 'auth_token';
export const AUTH_USER_COOKIE = 'auth_user';

export const authCookieOptions = {
  expires: '30d' as const,
  path: '/',
  sameSite: 'Lax' as const,
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
};

export function getAuthTokenFromCookie(): string | null {
  return Cookies.get(AUTH_TOKEN_COOKIE) ?? null;
}

export function getAuthUserFromCookie(): string | null {
  return Cookies.get(AUTH_USER_COOKIE) ?? null;
}

export function setAuthCookies(token: string, userJson: string): void {
  Cookies.set(AUTH_TOKEN_COOKIE, token, authCookieOptions);
  Cookies.set(AUTH_USER_COOKIE, userJson, authCookieOptions);
}

export function clearAuthCookies(): void {
  Cookies.remove(AUTH_TOKEN_COOKIE, { path: '/' });
  Cookies.remove(AUTH_USER_COOKIE, { path: '/' });
}

export function migrateLegacyAuthToken(): string | null {
  const legacyToken = localStorage.getItem('auth_token');
  if (!legacyToken) {
    return null;
  }

  Cookies.set(AUTH_TOKEN_COOKIE, legacyToken, authCookieOptions);
  localStorage.removeItem('auth_token');

  return legacyToken;
}
