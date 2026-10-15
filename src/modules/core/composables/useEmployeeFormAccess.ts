import { computed, inject, provide, type ComputedRef, type InjectionKey } from 'vue';
import { useAuthStore } from '@core/stores/auth';
import {
  SELF_VIEW_EMPLOYEE_FORM_ACCESS,
  type EmployeeFormAccess,
  type EmployeeFormFieldMode,
  type EmployeeFormTabKey,
  type EmployeeFormTabMode,
} from '@core/types/employee-form-access';

export const EMPLOYEE_FORM_ACCESS_OVERRIDE: InjectionKey<{
  forceReadonly: ComputedRef<boolean>;
  mergeSelfView: ComputedRef<boolean>;
}> = Symbol('employeeFormAccessOverride');

export function provideReadonlyEmployeeProfile() {
  provide(EMPLOYEE_FORM_ACCESS_OVERRIDE, {
    forceReadonly: computed(() => true),
    mergeSelfView: computed(() => true),
  });
}

function asTabMode(value: unknown): EmployeeFormTabMode {
  return value === 'view' || value === 'edit' || value === 'hidden' ? value : 'hidden';
}

function asFieldMode(value: unknown): EmployeeFormFieldMode {
  return value === 'view' || value === 'edit' || value === 'locked' || value === 'hidden'
    ? value
    : 'hidden';
}

const EMPTY_EMPLOYEE_FORM_ACCESS: EmployeeFormAccess = {
  tabs: {},
  fields: {},
};

export function useEmployeeFormAccess() {
  const authStore = useAuthStore();
  const override = inject(EMPLOYEE_FORM_ACCESS_OVERRIDE, null);

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
    if (override?.mergeSelfView.value) {
      return asTabMode(SELF_VIEW_EMPLOYEE_FORM_ACCESS.tabs[tab]);
    }
    return asTabMode(access.value.tabs[tab]);
  }

  function fieldMode(field: string): EmployeeFormFieldMode {
    if (override?.mergeSelfView.value) {
      if (field in SELF_VIEW_EMPLOYEE_FORM_ACCESS.fields) {
        return asFieldMode(SELF_VIEW_EMPLOYEE_FORM_ACCESS.fields[field]);
      }
      return 'view';
    }
    return asFieldMode(access.value.fields[field]);
  }

  function isTabVisible(tab: EmployeeFormTabKey): boolean {
    return tabMode(tab) !== 'hidden';
  }

  function isTabEditable(tab: EmployeeFormTabKey): boolean {
    if (override?.forceReadonly.value) {
      return false;
    }
    return tabMode(tab) === 'edit';
  }

  function isFieldVisible(field: string): boolean {
    return fieldMode(field) !== 'hidden';
  }

  function canWriteField(field: string, isCreating: boolean): boolean {
    if (override?.forceReadonly.value) {
      return false;
    }
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
