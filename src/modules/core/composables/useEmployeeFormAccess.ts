import { computed } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import {
  FULL_EMPLOYEE_FORM_ACCESS,
  type EmployeeFormAccess,
  type EmployeeFormFieldMode,
  type EmployeeFormTabKey,
  type EmployeeFormTabMode,
} from '@core/types/employee-form-access';

function asTabMode(value: unknown): EmployeeFormTabMode {
  return value === 'view' || value === 'edit' || value === 'hidden' ? value : 'hidden';
}

function asFieldMode(value: unknown): EmployeeFormFieldMode {
  return value === 'view' || value === 'edit' || value === 'locked' || value === 'hidden'
    ? value
    : 'hidden';
}

const EMPTY_EMPLOYEE_FORM_ACCESS: EmployeeFormAccess = {
  tabs: Object.fromEntries(
    Object.keys(FULL_EMPLOYEE_FORM_ACCESS.tabs).map((key) => [key, 'hidden']),
  ) as EmployeeFormAccess['tabs'],
  fields: Object.fromEntries(
    Object.keys(FULL_EMPLOYEE_FORM_ACCESS.fields).map((key) => [key, 'hidden']),
  ) as EmployeeFormAccess['fields'],
};

export function useEmployeeFormAccess() {
  const authStore = useAuthStore();

  const access = computed<EmployeeFormAccess>(() => {
    const raw = authStore.user?.employeeFormAccess;
    if (!raw) {
      // Prefer restrictive until /user hydrates form access (avoids briefly showing full UI).
      return EMPTY_EMPLOYEE_FORM_ACCESS;
    }

    return {
      tabs: { ...EMPTY_EMPLOYEE_FORM_ACCESS.tabs, ...(raw.tabs ?? {}) },
      fields: { ...EMPTY_EMPLOYEE_FORM_ACCESS.fields, ...(raw.fields ?? {}) },
    };
  });

  function tabMode(tab: EmployeeFormTabKey): EmployeeFormTabMode {
    return asTabMode(access.value.tabs[tab]);
  }

  function fieldMode(field: string): EmployeeFormFieldMode {
    return asFieldMode(access.value.fields[field]);
  }

  function isTabVisible(tab: EmployeeFormTabKey): boolean {
    return tabMode(tab) !== 'hidden';
  }

  function isTabEditable(tab: EmployeeFormTabKey): boolean {
    return tabMode(tab) === 'edit';
  }

  function isFieldVisible(field: string): boolean {
    return fieldMode(field) !== 'hidden';
  }

  function canWriteField(field: string, isCreating: boolean): boolean {
    const mode = fieldMode(field);
    if (mode === 'edit') return true;
    if (mode === 'locked') return isCreating;
    return false;
  }

  function isFieldReadonly(field: string, isCreating: boolean): boolean {
    return isFieldVisible(field) && !canWriteField(field, isCreating);
  }

  const visibleStepperTabs = computed(() =>
    (['personal', 'address', 'employment', 'education', 'payment_details', 'contact'] as EmployeeFormTabKey[])
      .filter((tab) => isTabVisible(tab)),
  );

  return {
    access,
    tabMode,
    fieldMode,
    isTabVisible,
    isTabEditable,
    isFieldVisible,
    canWriteField,
    isFieldReadonly,
    visibleStepperTabs,
  };
}
