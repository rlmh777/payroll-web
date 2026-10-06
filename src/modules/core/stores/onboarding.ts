import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { MODULE_ROUTES, pathInModule } from '../config/module-routes';
import { useAuthStore } from './auth';

export interface OnboardingStep {
  id: string;
  title: string;
  body: string;
  target: string;
  placement?: 'bottom' | 'left';
}

export type PageTourKey = 'employees' | 'scheduler' | 'timesheet' | 'leaves' | 'payroll' | 'admin';
export type OnboardingTourKey = 'header' | PageTourKey;

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'applications',
    title: 'Applications',
    body: 'Switch between Payroll, HR, Core, and Administration. Each application has its own menus.',
    target: 'applications',
    placement: 'bottom',
  },
  {
    id: 'navigation',
    title: 'Navigation',
    body: 'These menus are the main work in the application you are in — employees, timesheets, payroll runs, and settings.',
    target: 'navigation',
    placement: 'bottom',
  },
  {
    id: 'notifications',
    title: 'Notifications',
    body: 'Approvals and alerts land here so you can jump straight to what needs attention.',
    target: 'notifications',
    placement: 'left',
  },
  {
    id: 'account',
    title: 'Your account',
    body: 'Open this menu to update your photo, choose the default application, or turn this tour on or off.',
    target: 'account',
    placement: 'left',
  },
];

export interface PageTour {
  key: PageTourKey;
  match: (path: string) => boolean;
  steps: OnboardingStep[];
}

function isEmployeesPath(path: string): boolean {
  if (!pathInModule(path, 'employees')) {
    return false;
  }

  return !path.endsWith('/new')
    && !path.endsWith('/import')
    && !path.endsWith('/vacancies')
    && !path.endsWith('/candidates')
    && !path.startsWith('/hr/vacancies')
    && !path.startsWith('/hr/candidates')
    && !path.includes('/new/')
    && !path.includes('/import/');
}

function isTimesheetPath(path: string): boolean {
  return path === MODULE_ROUTES.timesheet || path.startsWith(`${MODULE_ROUTES.timesheet}/`);
}

function isPayrollTourPath(path: string): boolean {
  return path.startsWith('/payroll/payroll-run') || path.startsWith(MODULE_ROUTES.reports);
}

function isAdminSettingsPath(path: string): boolean {
  return path === MODULE_ROUTES.adminSettings || path.startsWith(`${MODULE_ROUTES.adminSettings}/`);
}

function isLeavesListPath(path: string): boolean {
  return path === `${MODULE_ROUTES.leaves}/list` || path.endsWith('/leaves/list');
}

export const PAGE_TOURS: PageTour[] = [
  {
    key: 'employees',
    match: isEmployeesPath,
    steps: [
      {
        id: 'employees-search',
        title: 'Find people',
        body: 'Filter by name, status, or department. Search only narrows the list — it does not open a record.',
        target: 'employees-search',
        placement: 'bottom',
      },
      {
        id: 'employees-list',
        title: 'Open a record',
        body: 'Click a person to open their file. The list stays on the left so you can jump without leaving.',
        target: 'employees-list',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'scheduler',
    match: (path) => pathInModule(path, 'scheduler'),
    steps: [
      {
        id: 'scheduler-who',
        title: 'Who you can see',
        body: 'This list is people you can schedule — your team, or everyone if you have full access. Filters change who appears on the grid.',
        target: 'scheduler-who',
        placement: 'bottom',
      },
      {
        id: 'scheduler-assign',
        title: 'Assign shifts',
        body: 'Move through days here, then place shifts on the grid. Import is for bulk assignment when you have access.',
        target: 'scheduler-assign',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'timesheet',
    match: isTimesheetPath,
    steps: [
      {
        id: 'timesheet-review',
        title: 'Review hours',
        body: 'Work exceptions and missing hours first. Approve clean timesheets after the period looks right.',
        target: 'timesheet-review',
        placement: 'bottom',
      },
      {
        id: 'timesheet-who',
        title: 'Who is listed',
        body: 'The same team filters as the scheduler apply here. Narrow the list before you approve.',
        target: 'timesheet-who',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'leaves',
    match: isLeavesListPath,
    steps: [
      {
        id: 'leaves-search',
        title: 'Leave requests',
        body: 'Supervisors review their team first. Search by dates, person, or status to find what still needs you.',
        target: 'leaves-search',
        placement: 'bottom',
      },
      {
        id: 'leaves-flow',
        title: 'Then HR and accounts',
        body: 'After the supervisor, HR confirms policy. Accounts step in when leave needs payment confirmation.',
        target: 'leaves-flow',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'payroll',
    match: isPayrollTourPath,
    steps: [
      {
        id: 'payroll-run',
        title: 'Payroll run',
        body: 'This is the run itself. Resolve exceptions first, then approve clean employee timesheets.',
        target: 'payroll-run',
        placement: 'bottom',
      },
      {
        id: 'reports',
        title: 'Reports are separate',
        body: 'Reports are journals, filings, and bank files — not the payroll run. Open Reports when you need those outputs.',
        target: 'reports',
        placement: 'bottom',
      },
    ],
  },
  {
    key: 'admin',
    match: isAdminSettingsPath,
    steps: [
      {
        id: 'admin-settings',
        title: 'Administration',
        body: 'Pipelines, Login, and File Storage are the settings that change how the company works. Lookups such as Country are not toured.',
        target: 'admin-settings',
        placement: 'bottom',
      },
      {
        id: 'admin-nav',
        title: 'Find them here',
        body: 'Those three live in this Administration menu, along with users, roles, and modules.',
        target: 'navigation',
        placement: 'bottom',
      },
    ],
  },
];

function emptySeen(): Record<string, boolean> {
  return {};
}

export function pageTourForPath(path: string): PageTour | undefined {
  return PAGE_TOURS.find((tour) => tour.match(path));
}

export const useOnboardingStore = defineStore('onboarding', () => {
  const active = ref(false);
  const stepIndex = ref(0);
  const saving = ref(false);
  const dismissedThisSession = ref(false);
  const tourKey = ref<OnboardingTourKey>('header');
  const revealed = ref(false);

  const steps = computed(() => {
    if (tourKey.value === 'header') {
      return ONBOARDING_STEPS;
    }

    return PAGE_TOURS.find((tour) => tour.key === tourKey.value)?.steps ?? [];
  });

  const currentStep = computed(() => steps.value[stepIndex.value] ?? steps.value[0]);
  const isLast = computed(() => stepIndex.value >= steps.value.length - 1);
  const isPageTour = computed(() => tourKey.value !== 'header');

  function isEnabled(): boolean {
    return useAuthStore().user?.preferences?.onboardingEnabled !== false;
  }

  function isCompleted(): boolean {
    return Boolean(useAuthStore().user?.preferences?.onboardingCompleted);
  }

  function seenMap(): Record<string, boolean> {
    return { ...emptySeen(), ...(useAuthStore().user?.preferences?.onboardingSeen ?? {}) };
  }

  function hasSeen(key: PageTourKey): boolean {
    return Boolean(seenMap()[key]);
  }

  function start() {
    if (!useAuthStore().isAuthenticated) {
      return;
    }

    dismissedThisSession.value = false;
    tourKey.value = 'header';
    stepIndex.value = 0;
    revealed.value = false;
    active.value = true;
  }

  function startPage(key: PageTourKey) {
    if (!useAuthStore().isAuthenticated || !isEnabled()) {
      return;
    }

    const tour = PAGE_TOURS.find((item) => item.key === key);
    if (!tour) {
      return;
    }

    tourKey.value = key;
    stepIndex.value = 0;
    revealed.value = false;
    active.value = true;
  }

  function stop() {
    active.value = false;
    stepIndex.value = 0;
    tourKey.value = 'header';
  }

  function next() {
    if (isLast.value) {
      void complete();
      return;
    }

    stepIndex.value += 1;
  }

  function back() {
    if (stepIndex.value > 0) {
      stepIndex.value -= 1;
    }
  }

  function skipMissingTarget() {
    if (!active.value) {
      return;
    }

    if (isLast.value) {
      if (revealed.value) {
        void complete();
        return;
      }

      stop();
      return;
    }

    stepIndex.value += 1;
  }

  async function persist(partial: {
    onboardingEnabled?: boolean;
    onboardingCompleted?: boolean;
    onboardingSeen?: Record<string, boolean>;
  }) {
    const authStore = useAuthStore();
    if (!authStore.token) {
      return;
    }

    saving.value = true;
    try {
      const payload: {
        defaultModule: string;
        onboardingEnabled: boolean;
        onboardingCompleted: boolean;
        onboardingSeen?: Record<string, boolean>;
      } = {
        defaultModule: authStore.user?.preferences?.defaultModule ?? 'payroll',
        onboardingEnabled: partial.onboardingEnabled
          ?? authStore.user?.preferences?.onboardingEnabled
          ?? true,
        onboardingCompleted: partial.onboardingCompleted
          ?? authStore.user?.preferences?.onboardingCompleted
          ?? false,
      };

      if (partial.onboardingSeen) {
        payload.onboardingSeen = partial.onboardingSeen;
      }

      await authStore.updatePreferences(payload);
    } finally {
      saving.value = false;
    }
  }

  async function complete() {
    if (tourKey.value === 'header') {
      dismissedThisSession.value = true;
      stop();
      await persist({ onboardingCompleted: true, onboardingEnabled: true });
      return;
    }

    const key = tourKey.value;
    stop();
    await persist({
      onboardingSeen: {
        ...seenMap(),
        [key]: true,
      },
    });
  }

  async function skip() {
    await complete();
  }

  async function setEnabled(enabled: boolean) {
    if (!enabled) {
      dismissedThisSession.value = true;
      stop();
      await persist({ onboardingEnabled: false, onboardingCompleted: true });
      return;
    }

    dismissedThisSession.value = false;
    await persist({
      onboardingEnabled: true,
      onboardingCompleted: false,
      onboardingSeen: emptySeen(),
    });
    start();
  }

  async function replay() {
    dismissedThisSession.value = false;
    await persist({
      onboardingEnabled: true,
      onboardingCompleted: false,
      onboardingSeen: emptySeen(),
    });
    start();
  }

  function maybeAutoStart() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated || active.value || dismissedThisSession.value) {
      return;
    }

    if (isEnabled() && !isCompleted()) {
      start();
    }
  }

  function maybeAutoStartPage(path: string) {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated || active.value || !isEnabled()) {
      return;
    }

    if (!isCompleted() && !dismissedThisSession.value) {
      return;
    }

    const tour = pageTourForPath(path);
    if (!tour || hasSeen(tour.key)) {
      return;
    }

    startPage(tour.key);
  }

  return {
    active,
    stepIndex,
    saving,
    tourKey,
    revealed,
    steps,
    currentStep,
    isLast,
    isPageTour,
    isEnabled,
    isCompleted,
    hasSeen,
    start,
    startPage,
    stop,
    next,
    back,
    skip,
    skipMissingTarget,
    complete,
    setEnabled,
    replay,
    maybeAutoStart,
    maybeAutoStartPage,
  };
});
