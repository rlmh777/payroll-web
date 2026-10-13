const FRESH_LOGIN_KEY = 'payroll:motd-fresh-login';

let inFlight: Promise<void> | null = null;
let lastDailyCheckOn = '';

export function markMotdFreshLogin(): void {
  try {
    sessionStorage.setItem(FRESH_LOGIN_KEY, '1');
  } catch {
    // Private mode can block sessionStorage.
  }
}

export function peekMotdReason(): 'login' | 'daily' {
  try {
    return sessionStorage.getItem(FRESH_LOGIN_KEY) === '1' ? 'login' : 'daily';
  } catch {
    return 'daily';
  }
}

export function clearMotdFreshLogin(): void {
  try {
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function resetMotdSession(): void {
  inFlight = null;
  lastDailyCheckOn = '';
  try {
    sessionStorage.removeItem(FRESH_LOGIN_KEY);
  } catch {
    // Ignore storage failures.
  }
}

export function shouldSkipDailyMotd(today: string): boolean {
  return lastDailyCheckOn === today;
}

export function markDailyMotdChecked(today: string): void {
  lastDailyCheckOn = today;
}

export function runMotdClaim(task: () => Promise<void>): Promise<void> {
  if (inFlight) {
    return inFlight;
  }
  inFlight = task().finally(() => {
    inFlight = null;
  });
  return inFlight;
}
