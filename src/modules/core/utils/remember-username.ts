/**
 * Persist remembered login username across sessions.
 */
const REMEMBER_USERNAME_KEY = 'payroll.remember_username';
const REMEMBER_USERNAME_ENABLED_KEY = 'payroll.remember_username_enabled';

export function getRememberedUsername(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  if (localStorage.getItem(REMEMBER_USERNAME_ENABLED_KEY) !== '1') {
    return '';
  }
  return localStorage.getItem(REMEMBER_USERNAME_KEY) ?? '';
}

export function isRememberUsernameEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return localStorage.getItem(REMEMBER_USERNAME_ENABLED_KEY) === '1';
}

export function setRememberUsername(enabled: boolean, username: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  if (!enabled) {
    localStorage.removeItem(REMEMBER_USERNAME_KEY);
    localStorage.setItem(REMEMBER_USERNAME_ENABLED_KEY, '0');
    return;
  }
  localStorage.setItem(REMEMBER_USERNAME_ENABLED_KEY, '1');
  localStorage.setItem(REMEMBER_USERNAME_KEY, username.trim());
}
