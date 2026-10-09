/**
 * Persist accounts that have signed in on this device, for the login chooser.
 */
const ACCOUNTS_KEY = 'payroll.remembered_accounts';
const LEGACY_USERNAME_KEY = 'payroll.remember_username';
const LEGACY_ENABLED_KEY = 'payroll.remember_username_enabled';

export interface RememberedAccount {
  id: string;
  name: string;
  username: string;
  email: string;
  pictureUrl: string | null;
  hasPasskeys: boolean;
  lastUsedAt: string;
}

export interface RememberedAccountInput {
  id: string | number;
  name: string;
  username?: string | null;
  email?: string | null;
  pictureUrl?: string | null;
  hasPasskeys?: boolean;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isAccount(value: unknown): value is RememberedAccount {
  if (!isRecord(value)) {
    return false;
  }
  return (
    typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.username === 'string'
    && typeof value.email === 'string'
  );
}

function persist(accounts: RememberedAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
}

function migrateLegacyUsername(): void {
  const enabled = localStorage.getItem(LEGACY_ENABLED_KEY) === '1';
  const username = (localStorage.getItem(LEGACY_USERNAME_KEY) ?? '').trim();
  localStorage.removeItem(LEGACY_USERNAME_KEY);
  localStorage.removeItem(LEGACY_ENABLED_KEY);

  if (!enabled || !username || localStorage.getItem(ACCOUNTS_KEY)) {
    return;
  }

  persist([
    {
      id: `legacy:${username.toLowerCase()}`,
      name: username,
      username,
      email: username,
      pictureUrl: null,
      hasPasskeys: false,
      lastUsedAt: new Date().toISOString(),
    },
  ]);
}

export function listRememberedAccounts(): RememberedAccount[] {
  if (typeof window === 'undefined') {
    return [];
  }

  migrateLegacyUsername();

  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter(isAccount)
      .map((account) => ({
        ...account,
        pictureUrl: account.pictureUrl ?? null,
        hasPasskeys: Boolean(account.hasPasskeys),
        lastUsedAt: account.lastUsedAt || new Date(0).toISOString(),
      }))
      .sort((left, right) => right.lastUsedAt.localeCompare(left.lastUsedAt));
  } catch {
    return [];
  }
}

export function upsertRememberedAccount(input: RememberedAccountInput): RememberedAccount {
  const accounts = listRememberedAccounts();
  const id = String(input.id);
  const username = (input.username || input.email || '').trim();
  const email = (input.email || username).trim();
  const next: RememberedAccount = {
    id,
    name: input.name.trim() || username,
    username,
    email,
    pictureUrl: input.pictureUrl ?? null,
    hasPasskeys: Boolean(input.hasPasskeys),
    lastUsedAt: new Date().toISOString(),
  };
  const usernameKey = username.toLowerCase();
  const without = accounts.filter(
    (account) =>
      account.id !== id
      && account.id !== `legacy:${usernameKey}`
      && account.username.toLowerCase() !== usernameKey
      && account.email.toLowerCase() !== email.toLowerCase(),
  );
  without.unshift(next);
  persist(without);
  return next;
}

export function updateRememberedAccountPasskeys(id: string, hasPasskeys: boolean): void {
  const accounts = listRememberedAccounts().map((account) =>
    account.id === id ? { ...account, hasPasskeys } : account,
  );
  persist(accounts);
}

export function removeRememberedAccount(id: string): void {
  persist(listRememberedAccounts().filter((account) => account.id !== id));
}

export function accountInitials(account: Pick<RememberedAccount, 'name' | 'username'>): string {
  const parts = account.name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const first = parts[0]?.[0] ?? '';
    const last = parts[parts.length - 1]?.[0] ?? '';
    return `${first}${last}`.toUpperCase();
  }
  const source = (parts[0] || account.username || '?').trim();
  return source.slice(0, 2).toUpperCase();
}

export function accountSecondaryLabel(account: Pick<RememberedAccount, 'email' | 'username'>): string {
  return account.email || account.username;
}
