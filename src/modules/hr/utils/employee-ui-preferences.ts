import type { EmployeeFormTabKey } from '@core/types/employee-form-access';
import type { EmployeeDetailsTab } from '@hr/stores/employee-store';

const PROFILE_TAB_KEY = 'payroll-employee-profile-tab';
const DETAILS_TAB_KEY = 'payroll-employee-details-tab';

const PROFILE_TABS: EmployeeFormTabKey[] = [
  'personal',
  'address',
  'employment',
  'education',
  'payment_details',
  'contact',
];

const DETAILS_TABS: EmployeeDetailsTab[] = [
  'allowances',
  'deductions',
  'historical-deductions',
  'ss-benefit',
  'contracts',
  'compensation',
  'documents',
  'incidents',
  'time-travel',
];

function readStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Private mode / blocked storage — ignore.
  }
}

export function getRememberedProfileTab(
  fallback: EmployeeFormTabKey = 'personal',
): EmployeeFormTabKey {
  const value = readStorage(PROFILE_TAB_KEY);
  if (value && PROFILE_TABS.includes(value as EmployeeFormTabKey)) {
    return value as EmployeeFormTabKey;
  }
  return fallback;
}

export function setRememberedProfileTab(tab: EmployeeFormTabKey): void {
  if (!PROFILE_TABS.includes(tab)) {
    return;
  }
  writeStorage(PROFILE_TAB_KEY, tab);
}

export function getRememberedDetailsTab(
  fallback: EmployeeDetailsTab = 'allowances',
): EmployeeDetailsTab {
  const value = readStorage(DETAILS_TAB_KEY);
  if (value && DETAILS_TABS.includes(value as EmployeeDetailsTab)) {
    return value as EmployeeDetailsTab;
  }
  return fallback;
}

export function setRememberedDetailsTab(tab: EmployeeDetailsTab): void {
  if (!DETAILS_TABS.includes(tab)) {
    return;
  }
  writeStorage(DETAILS_TAB_KEY, tab);
}
