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
import { clearStoredActiveModule } from '@core/utils/module-navigation';
import type { EmployeeFormAccess } from '@core/types/employee-form-access';

export interface UserPreferences {
  defaultModule: string;
  onboardingEnabled: boolean;
  onboardingCompleted: boolean;
  onboardingSeen: Record<string, boolean>;
}

interface User {
  id: string | number;
  email: string;
  username?: string | null;
  name: string;
  pictureUrl?: string | null;
  role: string;
  roles?: string[];
  permissions?: string[];
  employeeFormAccess?: EmployeeFormAccess;
  preferences?: UserPreferences;
  hasPasskeys?: boolean;
}

export type PasswordLoginResult =
  | { type: 'success'; hasPasskeys: boolean }
  | { type: 'two_factor'; challengeKey: string }
  | { type: 'two_factor_setup'; challengeKey: string }
  | { type: 'error' };

export interface TwoFactorSetupOptions {
  secret: string;
  otpauth_url: string;
  qr_svg: string;
  challenge_key?: string | null;
}

type UnauthorizedHandler = (redirectPath?: string) => void;

const API_URL = import.meta.env.VITE_API_URL || process.env.API_URL || 'http://localhost:3031/api';
const SESSION_VALIDATION_TTL_MS = 60 * 1000;

function normalizeOnboardingSeen(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, seen]) => [key, Boolean(seen)]),
  );
}

function normalizeUser(data: Partial<User> & {
  preferences?: {
    defaultModule?: string;
    onboardingEnabled?: boolean;
    onboardingCompleted?: boolean;
    onboardingSeen?: Record<string, boolean>;
    onboarding_enabled?: boolean;
    onboarding_completed?: boolean;
    onboarding_seen?: Record<string, boolean>;
  };
  hasPasskeys?: boolean;
  has_passkeys?: boolean;
  pictureUrl?: string | null;
  picture_url?: string | null;
}): User {
  const user: User = {
    id: data.id as string | number,
    email: data.email ?? '',
    username: data.username ?? null,
    name: data.name ?? '',
    pictureUrl: data.pictureUrl ?? data.picture_url ?? null,
    role: data.role ?? 'employee',
    roles: data.roles ?? (data.role ? [data.role] : []),
    permissions: data.permissions ?? [],
    preferences: {
      defaultModule: data.preferences?.defaultModule ?? 'payroll',
      onboardingEnabled: data.preferences?.onboardingEnabled ?? data.preferences?.onboarding_enabled !== false,
      onboardingCompleted: Boolean(
        data.preferences?.onboardingCompleted ?? data.preferences?.onboarding_completed,
      ),
      onboardingSeen: normalizeOnboardingSeen(
        data.preferences?.onboardingSeen ?? data.preferences?.onboarding_seen,
      ),
    },
    hasPasskeys: Boolean(data.hasPasskeys ?? data.has_passkeys),
  };

  if (data.employeeFormAccess) {
    user.employeeFormAccess = data.employeeFormAccess;
  }

  return user;
}

function payloadHasPasskeys(data: {
  has_passkeys?: boolean;
  user?: { hasPasskeys?: boolean; has_passkeys?: boolean };
}): boolean {
  return Boolean(data.has_passkeys ?? data.user?.hasPasskeys ?? data.user?.has_passkeys);
}

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
    user.value = normalizeUser(userValue);
    isAuthenticated.value = true;
    lastValidatedAt.value = Date.now();
    setAuthCookies(tokenValue, JSON.stringify(user.value));
  }

  function clearSession() {
    token.value = null;
    user.value = null;
    isAuthenticated.value = false;
    lastValidatedAt.value = 0;
    clearAuthCookies();
    clearStoredActiveModule();
  }

  function applyLoginPayload(data: { token?: string; user?: User }): boolean {
    if (!data.token || !data.user) {
      return false;
    }
    setSession(data.token, data.user);
    return true;
  }

  async function login(usernameOrEmail: string, password: string): Promise<PasswordLoginResult> {
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // API field is still "email" but accepts username or email.
        body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();

      if (data.requires_two_factor && data.challenge_key) {
        return { type: 'two_factor', challengeKey: data.challenge_key };
      }

      if (data.requires_two_factor_setup && data.challenge_key) {
        return { type: 'two_factor_setup', challengeKey: data.challenge_key };
      }

      if (!applyLoginPayload(data)) {
        throw new Error('Login response missing session');
      }

      return { type: 'success', hasPasskeys: payloadHasPasskeys(data) };
    } catch (error) {
      console.error('Login error:', error);
      Notify.create({
        type: 'negative',
        message: 'Invalid username/email or password.',
        position: 'top',
      });
      return { type: 'error' };
    }
  }

  async function verifyTwoFactor(
    challengeKey: string,
    code: string,
  ): Promise<{ ok: true; hasPasskeys: boolean } | { ok: false }> {
    try {
      const response = await fetch(`${API_URL}/login/two-factor/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_key: challengeKey, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Invalid authentication code.');
      }
      if (!applyLoginPayload(data)) {
        throw new Error('Two-factor response missing session');
      }
      return { ok: true, hasPasskeys: payloadHasPasskeys(data) };
    } catch (error) {
      console.error('Two-factor verify error:', error);
      Notify.create({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Invalid authentication code.',
        position: 'top',
      });
      return { ok: false };
    }
  }

  async function beginTwoFactorSetup(challengeKey: string): Promise<TwoFactorSetupOptions | null> {
    try {
      const response = await fetch(`${API_URL}/login/two-factor/setup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_key: challengeKey }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Unable to start authenticator setup.');
      }
      return data as TwoFactorSetupOptions;
    } catch (error) {
      console.error('Two-factor setup start error:', error);
      Notify.create({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Unable to start authenticator setup.',
        position: 'top',
      });
      return null;
    }
  }

  async function confirmTwoFactorSetup(
    challengeKey: string,
    code: string,
  ): Promise<{ recoveryCodes: string[]; hasPasskeys: boolean } | null> {
    try {
      const response = await fetch(`${API_URL}/login/two-factor/setup/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_key: challengeKey, code }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || 'Invalid authentication code.');
      }
      if (!applyLoginPayload(data)) {
        throw new Error('Two-factor setup response missing session');
      }
      return {
        recoveryCodes: Array.isArray(data.recovery_codes) ? data.recovery_codes : [],
        hasPasskeys: payloadHasPasskeys(data),
      };
    } catch (error) {
      console.error('Two-factor setup confirm error:', error);
      Notify.create({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Invalid authentication code.',
        position: 'top',
      });
      return null;
    }
  }

  async function loginWithPasskey(usernameOrEmail: string) {
    try {
      const { startAuthentication } = await import('@simplewebauthn/browser');

      const optionsResponse = await fetch(`${API_URL}/login/passkey/options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameOrEmail, email: usernameOrEmail }),
      });
      if (!optionsResponse.ok) {
        throw new Error('Unable to start passkey login');
      }
      const { options, challenge_key: challengeKey, has_passkeys: hasPasskeys } = await optionsResponse.json();
      if (hasPasskeys === false) {
        throw new Error(
          'No passkey is registered for this account. Sign in with your password, then create a passkey for this device.',
        );
      }

      const credential = await startAuthentication({ optionsJSON: options });

      const verifyResponse = await fetch(`${API_URL}/login/passkey`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challenge_key: challengeKey,
          credential,
        }),
      });
      if (!verifyResponse.ok) {
        const err = await verifyResponse.json().catch(() => ({}));
        throw new Error(err.message || 'Passkey login failed');
      }

      const data = await verifyResponse.json();
      if (!applyLoginPayload(data)) {
        throw new Error('Passkey login response missing session');
      }
      return true;
    } catch (error) {
      console.error('Passkey login error:', error);
      Notify.create({
        type: 'negative',
        message: error instanceof Error ? error.message : 'Passkey login failed.',
        position: 'top',
      });
      return false;
    }
  }

  async function registerCurrentDevicePasskey(name = 'This device'): Promise<boolean> {
    if (!token.value) {
      Notify.create({
        type: 'negative',
        message: 'Sign in before creating a passkey.',
        position: 'top',
      });
      return false;
    }

    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      const optionsResponse = await fetch(`${API_URL}/passkeys/options`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
      });
      if (!optionsResponse.ok) {
        const err = await optionsResponse.json().catch(() => ({}));
        throw new Error(err.message || 'Unable to start passkey registration');
      }
      const { options, challenge_key: challengeKey } = await optionsResponse.json();
      const credential = await startRegistration({ optionsJSON: options });
      const registerResponse = await fetch(`${API_URL}/passkeys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.value}`,
        },
        body: JSON.stringify({
          challenge_key: challengeKey,
          credential,
          name,
        }),
      });
      if (!registerResponse.ok) {
        const err = await registerResponse.json().catch(() => ({}));
        throw new Error(err.message || 'Passkey registration failed');
      }
      Notify.create({
        type: 'positive',
        message: 'Passkey created. You can use it the next time you sign in.',
        position: 'top',
      });
      return true;
    } catch (error) {
      const cancelled =
        error instanceof Error &&
        /not allowed|abort|cancel/i.test(error.message);
      if (!cancelled) {
        console.error('Passkey registration error:', error);
      }
      Notify.create({
        type: cancelled ? 'warning' : 'negative',
        message: error instanceof Error ? error.message : 'Passkey registration failed.',
        position: 'top',
      });
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
        user.value = normalizeUser(JSON.parse(storedUser) as User);
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
    const hasFormAccess = Boolean(user.value?.employeeFormAccess);

    if (hasPermissions && hasRole && hasFormAccess) {
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
    const missingFormAccess = !user.value?.employeeFormAccess;
    if (!options.force && isFresh && !missingPermissions && !missingFormAccess) {
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
      const hydrated = normalizeUser(data);
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

  function applyUserPayload(data: Partial<User>): User {
    const hydrated = normalizeUser(data);
    user.value = hydrated;
    if (token.value) {
      setAuthCookies(token.value, JSON.stringify(hydrated));
    }

    return hydrated;
  }

  async function updatePreferences(preferences: Partial<UserPreferences>) {
    if (!token.value) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/user/preferences`, {
      method: 'PUT',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body: JSON.stringify(preferences),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.message || 'Failed to update preferences');
    }

    const data = await response.json();
    return applyUserPayload(data);
  }

  async function updatePicture(file: File) {
    if (!token.value) {
      throw new Error('Not authenticated');
    }

    const body = new FormData();
    body.append('picture', file);

    const response = await fetch(`${API_URL}/user/picture`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
      body,
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as {
        message?: string;
        errors?: { picture?: string[] };
      };
      const firstError = payload.errors?.picture?.[0];
      throw new Error(firstError || payload.message || 'Failed to update profile picture');
    }

    const data = await response.json();
    return applyUserPayload(data);
  }

  async function removePicture() {
    if (!token.value) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_URL}/user/picture`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token.value}`,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      throw new Error(payload.message || 'Failed to remove profile picture');
    }

    const data = await response.json();
    return applyUserPayload(data);
  }

  return {
    token,
    user,
    isAuthenticated,
    login,
    verifyTwoFactor,
    beginTwoFactorSetup,
    confirmTwoFactorSetup,
    loginWithPasskey,
    registerCurrentDevicePasskey,
    logout,
    checkAuth,
    ensureUser,
    ensureHydratedPermissions,
    validateSession,
    updatePreferences,
    updatePicture,
    removePicture,
    handleUnauthorized,
    handleSessionTimeout,
    setUnauthorizedHandler,
  };
});
