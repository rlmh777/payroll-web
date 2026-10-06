import { defineStore, acceptHMRUpdate } from 'pinia';
import { useAuthStore } from '@core/stores/auth';

export type UsernamePattern = 'first_last' | 'last_first' | 'first_initial_last' | 'firstlast';
export type UsernameSeparator = '.' | '_' | '-' | '';
export type TwoFactorPolicy = 'off' | 'optional' | 'required';

export const USERNAME_PATTERN_CATALOG: Array<{
  value: UsernamePattern;
  title: string;
  example: (separator: UsernameSeparator) => string;
}> = [
  {
    value: 'first_last',
    title: 'First name + last name',
    example: (separator) => `john${separator}doe`,
  },
  {
    value: 'last_first',
    title: 'Last name + first name',
    example: (separator) => `doe${separator}john`,
  },
  {
    value: 'first_initial_last',
    title: 'First initial + last name',
    example: (separator) => `j${separator}doe`,
  },
  {
    value: 'firstlast',
    title: 'First and last with no separator',
    example: () => 'johndoe',
  },
];

export interface LoginSettings {
  two_factor_policy: TwoFactorPolicy;
  passkeys_enabled: boolean;
  username_pattern: UsernamePattern;
  username_patterns: UsernamePattern[];
  username_separator: UsernameSeparator;
  username_include_middle_initial: boolean;
  employee_login_domain: string | null;
  username_preview: string;
  username_preview_with_middle: string;
  username_preview_candidates: string[];
}

export interface LoginSettingsPayload {
  two_factor_policy?: TwoFactorPolicy;
  passkeys_enabled?: boolean;
  username_pattern?: UsernamePattern;
  username_patterns?: UsernamePattern[];
  username_separator?: UsernameSeparator;
  username_include_middle_initial?: boolean;
  employee_login_domain?: string | null;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3031/api';
const PATTERN_VALUES = USERNAME_PATTERN_CATALOG.map((item) => item.value);

function isUsernamePattern(value: unknown): value is UsernamePattern {
  return typeof value === 'string' && PATTERN_VALUES.includes(value as UsernamePattern);
}

export function normalizeUsernamePatterns(values: unknown): UsernamePattern[] {
  const source = Array.isArray(values) ? values : [values];
  const patterns: UsernamePattern[] = [];

  for (const value of source) {
    if (isUsernamePattern(value) && !patterns.includes(value)) {
      patterns.push(value);
    }
  }

  return patterns.length > 0 ? patterns : ['first_last'];
}

function normalizeSettings(data: Partial<LoginSettings> | null | undefined): LoginSettings {
  const patterns = normalizeUsernamePatterns(
    data?.username_patterns?.length ? data.username_patterns : data?.username_pattern,
  );
  const separator = data?.username_separator;

  return {
    two_factor_policy:
      data?.two_factor_policy === 'optional' || data?.two_factor_policy === 'required'
        ? data.two_factor_policy
        : 'off',
    passkeys_enabled: data?.passkeys_enabled ?? true,
    username_pattern: patterns[0] ?? 'first_last',
    username_patterns: patterns,
    username_separator:
      separator === '_' || separator === '-' || separator === '' ? separator : '.',
    username_include_middle_initial: data?.username_include_middle_initial ?? true,
    employee_login_domain: data?.employee_login_domain ?? null,
    username_preview: data?.username_preview ?? 'john.doe',
    username_preview_with_middle: data?.username_preview_with_middle ?? 'john.m.doe',
    username_preview_candidates: Array.isArray(data?.username_preview_candidates)
      ? data.username_preview_candidates.filter((value): value is string => typeof value === 'string')
      : [],
  };
}

export const useLoginSettingsStore = defineStore('loginSettings', {
  state: () => ({
    settings: null as LoginSettings | null,
    isLoading: false,
    isSaving: false,
    error: null as string | null,
  }),

  actions: {
    buildHeaders(): HeadersInit {
      const authStore = useAuthStore();
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (authStore.token) {
        headers.Authorization = `Bearer ${authStore.token}`;
      }
      return headers;
    },

    async fetchSettings() {
      this.isLoading = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/auth-settings`, {
          headers: this.buildHeaders(),
        });
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.message || 'Failed to load login settings');
        }
        this.settings = normalizeSettings(await response.json());
        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to load login settings';
        return null;
      } finally {
        this.isLoading = false;
      }
    },

    async updateSettings(payload: LoginSettingsPayload) {
      this.isSaving = true;
      this.error = null;

      try {
        const response = await fetch(`${API_URL}/auth-settings`, {
          method: 'PUT',
          headers: this.buildHeaders(),
          body: JSON.stringify(payload),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.message || 'Failed to save login settings');
        }
        this.settings = normalizeSettings(body);
        return this.settings;
      } catch (error) {
        this.error = error instanceof Error ? error.message : 'Failed to save login settings';
        throw error;
      } finally {
        this.isSaving = false;
      }
    },
  },
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useLoginSettingsStore, import.meta.hot));
}
