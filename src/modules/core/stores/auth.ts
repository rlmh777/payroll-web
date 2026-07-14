import { defineStore } from 'pinia';
import { ref } from 'vue';
import { Notify } from 'quasar';
import {
  clearAuthCookies,
  getAuthTokenFromCookie,
  getAuthUserFromCookie,
  migrateLegacyAuthToken,
  setAuthCookies,
} from '@core/utils/auth-cookies';

interface User {
  id: string | number;
  email: string;
  name: string;
  role: string;
  roles?: string[];
  permissions?: string[];
}

type UnauthorizedHandler = (redirectPath?: string) => void;

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';
const SESSION_VALIDATION_TTL_MS = 60 * 1000;

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null);
  const user = ref<User | null>(null);
  const isAuthenticated = ref(false);
  const lastValidatedAt = ref(0);

  let unauthorizedHandler: UnauthorizedHandler | null = null;
  let handlingUnauthorized = false;

  function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
    unauthorizedHandler = handler;
  }

  function setSession(tokenValue: string, userValue: User) {
    token.value = tokenValue;
    user.value = userValue;
    isAuthenticated.value = true;
    lastValidatedAt.value = Date.now();
    setAuthCookies(tokenValue, JSON.stringify(userValue));
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    lastValidatedAt.value = 0;
    clearAuthCookies();
  }

  async function login(email: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setSession(data.token, data.user);

      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  async function logout() {
    if (token.value) {
      try {
        await fetch(`${API_URL}/logout`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.value}`,
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    clearSession();
  }

  function checkAuth() {
    const storedToken = getAuthTokenFromCookie() ?? migrateLegacyAuthToken();

    if (!storedToken) {
      clearSession();
      return;
    }

    token.value = storedToken;
    isAuthenticated.value = true;

    const storedUser = getAuthUserFromCookie();
    if (storedUser) {
      try {
        user.value = JSON.parse(storedUser) as User;
      } catch {
        user.value = null;
      }
    }
  }

  async function ensureHydratedPermissions(): Promise<boolean> {
    checkAuth();

    if (!token.value) {
      return false;
    }

    const hasPermissions = Array.isArray(user.value?.permissions) && user.value.permissions.length > 0;
    const hasRole = Boolean(user.value?.role || user.value?.roles?.length);

    if (hasPermissions && hasRole) {
      return validateSession();
    }

    return validateSession({ force: true });
  }

  function handleUnauthorized(message = 'Your session has expired. Please sign in again.') {
    if (handlingUnauthorized || !isAuthenticated.value) {
      clearSession();
      return;
    }

    handlingUnauthorized = true;
    const redirectPath = unauthorizedHandler
      ? window.location.hash.replace(/^#/, '') || '/'
      : undefined;

    clearSession();

    Notify.create({
      type: 'warning',
      message,
      position: 'top',
      timeout: 4000,
    });

    unauthorizedHandler?.(redirectPath);
    handlingUnauthorized = false;
  }

  function handleSessionTimeout() {
    handleUnauthorized('Your session timed out due to inactivity. Please sign in again.');
  }

  async function validateSession(options: { force?: boolean } = {}): Promise<boolean> {
    checkAuth();

    if (!token.value) {
      return false;
    }

    const isFresh = Date.now() - lastValidatedAt.value < SESSION_VALIDATION_TTL_MS;
    const missingPermissions = !Array.isArray(user.value?.permissions) || user.value.permissions.length === 0;
    if (!options.force && isFresh && !missingPermissions) {
      return true;
    }

    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        return false;
      }

      if (!response.ok) {
        return isAuthenticated.value;
      }

      const data = await response.json();
      const hydrated: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role ?? 'employee',
        roles: data.roles ?? (data.role ? [data.role] : []),
        permissions: data.permissions ?? [],
      };
      user.value = hydrated;
      isAuthenticated.value = true;
      lastValidatedAt.value = Date.now();
      setAuthCookies(token.value, JSON.stringify(hydrated));

      return true;
    } catch (error) {
      console.error('Failed to validate user session:', error);
      return isAuthenticated.value;
    }
  }

  async function ensureUser() {
    const isValid = await validateSession();

    if (!isValid) {
      return;
    }

    if (!user.value?.role && token.value) {
      await validateSession({ force: true });
    }
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    logout,
    checkAuth,
    ensureUser,
    ensureHydratedPermissions,
    validateSession,
    handleUnauthorized,
    handleSessionTimeout,
    setUnauthorizedHandler,
  };
});
